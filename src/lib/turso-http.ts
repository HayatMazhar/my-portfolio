/** Minimal Turso HTTP client — no @libsql npm package (cPanel-safe). */

export type TursoSqlValue = string | number | boolean | bigint | null | undefined;

export interface TursoRow {
  [column: string]: unknown;
}

export interface TursoResult {
  columns: string[];
  rows: TursoRow[];
  rowsAffected: number;
}

export interface TursoClient {
  execute(
    query:
      | string
      | {
          sql: string;
          args?: Record<string, TursoSqlValue> | TursoSqlValue[];
        },
  ): Promise<TursoResult>;
}

function libsqlUrlToHttp(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("libsql://")) {
    return `https://${trimmed.slice("libsql://".length).replace(/\/$/, "")}`;
  }
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed.replace(/\/$/, "");
  }
  throw new Error(`Unsupported Turso URL scheme: ${trimmed.split(":")[0] ?? "unknown"}`);
}

function encodeValue(value: TursoSqlValue): { type: string; value?: string } {
  if (value === null || value === undefined) return { type: "null" };
  if (typeof value === "bigint") return { type: "integer", value: value.toString() };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { type: "integer", value: String(value) };
    return { type: "float", value: String(value) };
  }
  if (typeof value === "boolean") return { type: "integer", value: value ? "1" : "0" };
  return { type: "text", value: String(value) };
}

type EncodedValue = { type: string; value?: string };

interface EncodedArgs {
  args?: EncodedValue[];
  named_args?: Array<{ name: string; value: EncodedValue }>;
}

/** Placeholder names used by the statement, ignoring string literals. */
function placeholderNames(sql: string): Set<string> {
  const withoutLiterals = sql.replace(/'(?:[^']|'')*'/g, "''");
  const names = new Set<string>();
  for (const match of withoutLiterals.matchAll(
    /[:@$]([A-Za-z_][A-Za-z0-9_]*)/g,
  )) {
    names.add(match[1]);
  }
  return names;
}

/**
 * Hrana binds positional parameters from `args` and named ones from
 * `named_args`. Flattening named parameters into `args` makes the server bind
 * them by position instead, which silently mismatches whenever the argument
 * order differs from the order the placeholders appear in the SQL.
 *
 * The server also rejects the request outright when the argument count differs
 * from the placeholder count, so extras are dropped here: several call sites
 * share one argument builder across statements that write different column
 * subsets. A placeholder with no argument is a genuine bug — binding it to NULL
 * would quietly blank a column — so that throws instead.
 */
function encodeArgs(
  sql: string,
  args: Record<string, TursoSqlValue> | TursoSqlValue[] | undefined,
): EncodedArgs {
  if (!args) return { args: [] };
  if (Array.isArray(args)) {
    return { args: args.map((value) => encodeValue(value)) };
  }

  const expected = placeholderNames(sql);
  const provided = new Map(
    Object.entries(args).map(([name, value]) => [
      name.replace(/^[:@$]/, ""),
      value,
    ]),
  );

  const missing = [...expected].filter((name) => !provided.has(name));
  if (missing.length > 0) {
    throw new Error(
      `Turso statement is missing argument(s): ${missing.join(", ")}.`,
    );
  }

  return {
    named_args: [...provided]
      .filter(([name]) => expected.has(name))
      .map(([name, value]) => ({ name, value: encodeValue(value) })),
  };
}

function rowToObject(columns: string[], values: unknown[]): TursoRow {
  const row: TursoRow = {};
  for (let i = 0; i < columns.length; i += 1) {
    row[columns[i]] = values[i];
  }
  return row;
}

function decodeCell(cell: unknown): unknown {
  if (cell == null || typeof cell !== "object") return cell;
  const typed = cell as { type?: string; value?: string | null };
  switch (typed.type) {
    case "null":
      return null;
    case "integer":
      return typed.value == null ? null : Number(typed.value);
    case "float":
      return typed.value == null ? null : Number(typed.value);
    case "text":
      return typed.value ?? null;
    case "blob":
      return typed.value ?? null;
    default:
      return typed.value ?? null;
  }
}

interface PipelineExecuteResult {
  cols?: Array<{ name?: string }>;
  rows?: unknown[][];
  affected_row_count?: number;
  last_insert_rowid?: number | null;
}

interface PipelineResultEntry {
  type?: string;
  error?: { message?: string };
  response?: {
    type?: string;
    error?: { message?: string };
    result?: PipelineExecuteResult;
  };
  result?: PipelineExecuteResult;
}

export function createTursoHttpClient(config: {
  url: string;
  authToken: string;
}): TursoClient {
  const baseUrl = libsqlUrlToHttp(config.url);
  const authToken = config.authToken.trim();

  return {
    async execute(query): Promise<TursoResult> {
      const stmt =
        typeof query === "string"
          ? { sql: query, args: [], want_rows: true }
          : {
              sql: query.sql,
              ...encodeArgs(query.sql, query.args),
              want_rows: true,
            };

      const res = await fetch(`${baseUrl}/v2/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [{ type: "execute", stmt }],
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Turso HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
        );
      }

      const payload = (await res.json()) as {
        results?: PipelineResultEntry[];
      };

      const first = payload.results?.[0];
      if (!first) throw new Error("Turso returned an empty pipeline response.");
      if (first.error?.message) throw new Error(first.error.message);
      if (first.type === "error") {
        throw new Error(first.error?.message ?? "Turso pipeline error.");
      }

      const response = first.response;
      if (response?.error?.message) throw new Error(response.error.message);
      if (response?.type === "error") {
        throw new Error(response.error?.message ?? "Turso execute error.");
      }

      const result = response?.result ?? first.result;
      if (!result) throw new Error("Turso pipeline missing execute result.");

      const columns = (result.cols ?? []).map((col, index) =>
        String(col.name ?? `col_${index}`),
      );
      const rows = (result.rows ?? []).map((rawRow) => {
        const values = Array.isArray(rawRow)
          ? rawRow.map(decodeCell)
          : [];
        return rowToObject(columns, values);
      });

      return {
        columns,
        rows,
        rowsAffected: result.affected_row_count ?? 0,
      };
    },
  };
}
