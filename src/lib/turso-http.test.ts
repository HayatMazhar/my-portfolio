import { describe, expect, it } from "vitest";
import { createTursoHttpClient } from "./turso-http";

describe("createTursoHttpClient", () => {
  it("parses pipeline execute responses", async () => {
    const client = createTursoHttpClient({
      url: "https://example.turso.io",
      authToken: "test-token",
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          results: [
            {
              type: "ok",
              response: {
                type: "execute",
                result: {
                  cols: [{ name: "n" }],
                  rows: [[{ type: "integer", value: "3" }]],
                  affected_row_count: 0,
                },
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as typeof fetch;

    try {
      const result = await client.execute("SELECT COUNT(*) AS n FROM posts");
      expect(result.rows[0]?.n).toBe(3);
      expect(result.columns).toEqual(["n"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  /**
   * Hrana binds `args` by position. Sending named parameters there made
   * statements like the posts UPDATE (where `:id` is written last but passed
   * first) bind every column to the wrong value and affect zero rows.
   */
  it("sends named parameters as named_args, not positional args", async () => {
    const client = createTursoHttpClient({
      url: "libsql://example.turso.io",
      authToken: "test-token",
    });

    const originalFetch = globalThis.fetch;
    let sentStmt: Record<string, unknown> | undefined;
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      const parsed = JSON.parse(String(init.body)) as {
        requests: Array<{ stmt: Record<string, unknown> }>;
      };
      sentStmt = parsed.requests[0]?.stmt;
      return new Response(
        JSON.stringify({
          results: [
            {
              type: "ok",
              response: {
                type: "execute",
                result: { cols: [], rows: [], affected_row_count: 1 },
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    try {
      const result = await client.execute({
        sql: "UPDATE posts SET body = :body WHERE id = :id",
        args: { id: "post-1", body: "generated" },
      });

      expect(result.rowsAffected).toBe(1);
      expect(sentStmt?.args).toBeUndefined();
      expect(sentStmt?.named_args).toEqual([
        { name: "id", value: { type: "text", value: "post-1" } },
        { name: "body", value: { type: "text", value: "generated" } },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  /**
   * Argument builders are shared between statements that write different
   * column subsets, and the server rejects any count mismatch.
   */
  it("drops named arguments the statement does not reference", async () => {
    const client = createTursoHttpClient({
      url: "libsql://example.turso.io",
      authToken: "test-token",
    });

    const originalFetch = globalThis.fetch;
    let sentStmt: Record<string, unknown> | undefined;
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      const parsed = JSON.parse(String(init.body)) as {
        requests: Array<{ stmt: Record<string, unknown> }>;
      };
      sentStmt = parsed.requests[0]?.stmt;
      return new Response(
        JSON.stringify({
          results: [
            {
              type: "ok",
              response: {
                type: "execute",
                result: { cols: [], rows: [], affected_row_count: 1 },
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    try {
      await client.execute({
        sql: "INSERT INTO linkedin_auth (id, access_token) VALUES (1, :access_token)",
        args: { access_token: "token", scope: "openid", updated_at: 5 },
      });

      expect(sentStmt?.named_args).toEqual([
        { name: "access_token", value: { type: "text", value: "token" } },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("throws when a referenced placeholder has no argument", async () => {
    const client = createTursoHttpClient({
      url: "libsql://example.turso.io",
      authToken: "test-token",
    });

    await expect(
      client.execute({
        sql: "UPDATE posts SET body = :body WHERE id = :id",
        args: { body: "text" },
      }),
    ).rejects.toThrow(/missing argument\(s\): id/);
  });

  it("ignores colons inside string literals", async () => {
    const client = createTursoHttpClient({
      url: "libsql://example.turso.io",
      authToken: "test-token",
    });

    const originalFetch = globalThis.fetch;
    let sentStmt: Record<string, unknown> | undefined;
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      const parsed = JSON.parse(String(init.body)) as {
        requests: Array<{ stmt: Record<string, unknown> }>;
      };
      sentStmt = parsed.requests[0]?.stmt;
      return new Response(
        JSON.stringify({
          results: [
            {
              type: "ok",
              response: {
                type: "execute",
                result: { cols: [], rows: [], affected_row_count: 1 },
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    try {
      await client.execute({
        sql: "UPDATE posts SET hook = 'urn:li:person:123' WHERE id = :id",
        args: { id: "post-1" },
      });

      expect(sentStmt?.named_args).toEqual([
        { name: "id", value: { type: "text", value: "post-1" } },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("keeps array arguments positional", async () => {
    const client = createTursoHttpClient({
      url: "libsql://example.turso.io",
      authToken: "test-token",
    });

    const originalFetch = globalThis.fetch;
    let sentStmt: Record<string, unknown> | undefined;
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      const parsed = JSON.parse(String(init.body)) as {
        requests: Array<{ stmt: Record<string, unknown> }>;
      };
      sentStmt = parsed.requests[0]?.stmt;
      return new Response(
        JSON.stringify({
          results: [
            {
              type: "ok",
              response: {
                type: "execute",
                result: { cols: [], rows: [], affected_row_count: 0 },
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    try {
      await client.execute({
        sql: "SELECT * FROM posts WHERE id = ? AND status = ?",
        args: ["post-1", "draft"],
      });

      expect(sentStmt?.named_args).toBeUndefined();
      expect(sentStmt?.args).toEqual([
        { type: "text", value: "post-1" },
        { type: "text", value: "draft" },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
