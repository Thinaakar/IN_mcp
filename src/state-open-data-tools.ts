import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { Env } from "./env";
import { listDatasets } from "./data-gov";
import { recordMentionsState, slimCatalogRecord, STATE_OPEN_DATA_PORTALS, type StateOpenDataPortal } from "./state-portals";

function nowIso(): string {
  return new Date().toISOString();
}

function toolResult(payload: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

async function searchStateCatalog(
  env: Env,
  portal: StateOpenDataPortal,
  query: string,
  page: number,
): Promise<{ records: Array<Record<string, unknown>>; total?: number; mode: string }> {
  const title = query.trim();
  const orgHit = await listDatasets(env, title, page, { org: portal.name, limit: 20 });
  const orgRecords = orgHit.records ?? [];
  if (orgRecords.length > 0) {
    return { records: orgRecords, total: orgHit.total ?? orgHit.count, mode: "org" };
  }

  const titleQuery = title || portal.defaultQuery;
  const titleHit = await listDatasets(env, titleQuery, page, { limit: 40 });
  const filtered = (titleHit.records ?? []).filter((record) => recordMentionsState(record, portal));
  return {
    records: filtered.length ? filtered : (titleHit.records ?? []),
    total: filtered.length || titleHit.total || titleHit.count,
    mode: filtered.length ? "title+state" : "title",
  };
}

export function registerStateOpenDataTools(server: McpServer, env: Env): void {
  for (const portal of Object.values(STATE_OPEN_DATA_PORTALS)) {
    const toolName = `${portal.code}_open_data`;
    server.registerTool(
      toolName,
      {
        title: `${portal.name} open data catalog`,
        description: `Search ${portal.name} public datasets via data.gov.in (the live API behind ${portal.portal}). Covers: ${portal.domains}. Use dataset_id with in_dataset_query to pull rows.`,
        inputSchema: {
          query: z
            .string()
            .optional()
            .describe(`Keyword in the dataset title. Defaults to '${portal.defaultQuery}' when org-filtered search is empty.`),
          page: z.number().int().min(1).default(1).describe("Result page number."),
        },
      },
      async ({ query, page }) => {
        const result = await searchStateCatalog(env, portal, query ?? "", page ?? 1);
        return toolResult({
          source: "data.gov.in",
          retrieved_at: nowIso(),
          license: "Government Open Data License - India",
          state: portal.name,
          portal: portal.portal,
          api_setu: portal.apiSetu,
          extra_portals: portal.extraPortals,
          domains: portal.domains,
          query: (query ?? "").trim() || portal.defaultQuery,
          search_mode: result.mode,
          page: page ?? 1,
          total: result.total,
          data: result.records.map(slimCatalogRecord),
        });
      },
    );
  }
}
