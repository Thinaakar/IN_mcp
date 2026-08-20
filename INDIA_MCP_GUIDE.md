# Monstarx India MCP — Structure Guide

This is a **new** India MCP project. Singapore MCP is a separate repo and must not be changed.

The file layout and code pattern match Singapore:

| Singapore file | India file | Role |
|---|---|---|
| `src/index.ts` | `src/index.ts` | HTTP router: `/`, `/health`, `/mcp` |
| `src/tools.ts` | `src/tools.ts` | Register MCP tools (`sg_*` → `in_*`) |
| `src/data-gov.ts` | `src/data-gov.ts` | Open-data catalogue + realtime weather |
| `src/onemap.ts` | `src/maps.ts` | Address search / geocode / reverse geocode |
| `src/lta.ts` | `src/transit.ts` | Bus / train / traffic client |
| `src/http.ts` | `src/http.ts` | Timeouts, CORS, JSON helpers |
| `src/env.ts` | `src/env.ts` | Env / secrets types |

## Repository structure

```text
IN-MCP/
├── src/
│   ├── index.ts           # HTTP router: /, /health, /mcp
│   ├── tools.ts           # All in_* MCP tools registered here
│   ├── data-gov.ts        # data.gov.in + Open-Meteo client
│   ├── maps.ts            # Nominatim address / geocode client
│   ├── transit.ts         # Transit client
│   ├── http.ts            # Timeouts, CORS, JSON helpers
│   └── env.ts             # Env / secrets type definitions
├── test/
│   └── tools.test.ts
├── scripts/
│   └── smoke.mjs
├── .github/workflows/
│   └── ci.yml
├── wrangler.jsonc
├── package.json
└── README.md
```

## HTTP endpoints

| Path | Role |
|---|---|
| `GET /` | Server info and tool list |
| `GET /health` | Health JSON |
| `POST /mcp` | MCP tools/list and tools/call |
| `OPTIONS *` | CORS preflight |

## Tool response format

Every tool uses `toolResult()` like Singapore:

- `content[0].text` — pretty JSON string
- `structuredContent` — same object
- provenance: `source`, `agency`, `api`, `retrieved_at`

## How to add a tool

Same as Singapore, in `src/tools.ts`:

1. Add the name to `toolNames`.
2. `server.registerTool("in_...", { title, description, inputSchema }, handler)`.
3. Call an adapter (`queryDataset`, `getRealtimeApi`, `searchMapsAddress`, `transitGet`).
4. Return `toolResult({ ...meta(), data })`.
5. Add a smoke case in `scripts/smoke.mjs`.
