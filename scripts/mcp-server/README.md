# Mazhar Hayat — CV MCP Server

A working [Model Context Protocol](https://modelcontextprotocol.io) server that
exposes my CV, projects, and the live portfolio RAG corpus as tools any
MCP-compatible AI agent can use.

> Most candidates put their CV on a website. I put mine in a protocol AI
> agents can query directly.

## Why?

If you're hiring AI engineers in 2026, you probably use AI assistants. Why
not let your assistant interview my CV directly — structured, grounded,
citation-friendly — instead of you copy-pasting my résumé into a prompt?

## Tools exposed

| Tool | Purpose |
|---|---|
| `get_profile` | Name, title, location, availability, contact, book-a-call link |
| `list_projects` | Flagship projects with slugs and one-line impact lines |
| `get_project(slug)` | Full case study for one project |
| `list_skills` | Categorised skills (Gen AI, RAG, frameworks, etc.) |
| `search_cv(query)` | Keyword search across the corpus — returns ranked chunks |
| `check_fit` | Returns the URL of the live AI Fit Analyser so the agent can hand off a JD analysis to it |

Resources: `cv://summary` (plain text), `cv://corpus` (full JSON corpus).

## Install + run locally

```bash
cd scripts/mcp-server
npm install
node server.mjs           # speaks stdio JSON-RPC
npm test                  # quick smoke test
```

## Wire into Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "mazhar-cv": {
      "command": "node",
      "args": ["/absolute/path/to/Portfolio/scripts/mcp-server/server.mjs"]
    }
  }
}
```

Restart Claude. You should see "mazhar-cv" in the tools list. Try asking:

> "Use the mazhar-cv tools to tell me about his RAG experience."

## Wire into Cursor / Cline / any MCP client

Same `command`/`args` pattern. Any client that speaks stdio MCP works.

## Behaviour

- **Read-only.** No writes anywhere. Safe to point any agent at it.
- **No external network calls.** All data is bundled with the server.
- **Falls back to the portfolio's live RAG endpoint** for semantic search if
  keyword search misses — the response will include the live URL so the
  agent can follow up via HTTP.

## License

MIT. Fork it, adapt it for your own CV. The pattern is reusable.

## Author

Mazhar Hayat · [Mazhar1783@outlook.com](mailto:Mazhar1783@outlook.com) ·
[Portfolio](https://mazharhayat.live)
