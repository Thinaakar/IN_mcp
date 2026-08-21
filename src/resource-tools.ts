import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { Env } from "./env";
import { queryDataGovResource } from "./data-gov";
import { RESOURCE_TOOL_DEFS, type ResourceToolDef } from "./resource-catalog";

function nowIso(): string {
  return new Date().toISOString();
}

function toolResult(payload: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function resourceMeta(def: ResourceToolDef, filters: Record<string, unknown>): Record<string, unknown> {
  return {
    source: "data.gov.in",
    retrieved_at: nowIso(),
    license: "Government Open Data License - India",
    agency: def.agency ?? "data.gov.in",
    dataset_id: def.resourceId,
    ...filters,
  };
}

function buildInputSchema(def: ResourceToolDef): Record<string, z.ZodType> {
  const schema: Record<string, z.ZodType> = {
    limit: z.number().int().min(1).max(1000).default(100).describe("Maximum rows to return."),
    offset: z.number().int().min(0).default(0).describe("Row offset for pagination."),
  };

  for (const filter of def.filters ?? []) {
    const name = filter.name ?? filter.field;
    schema[name] = z.string().optional().describe(filter.describe);
  }

  return schema;
}

function registerOne(server: McpServer, env: Env, def: ResourceToolDef): void {
  const inputSchema = buildInputSchema(def);

  server.registerTool(
    def.name,
    {
      title: def.title,
      description: def.description,
      inputSchema,
    },
    async (args) => {
      const limit = typeof args.limit === "number" ? args.limit : 100;
      const offset = typeof args.offset === "number" ? args.offset : 0;
      const filters: Record<string, string | undefined> = {};
      const metaFilters: Record<string, unknown> = {};

      for (const filter of def.filters ?? []) {
        const name = filter.name ?? filter.field;
        const value = args[name];
        if (typeof value === "string" && value.trim()) {
          filters[filter.field] = value.trim();
          metaFilters[name] = value.trim();
        }
      }

      const result = await queryDataGovResource(env, def.resourceId, {
        purpose: def.title,
        limit,
        offset,
        filters,
      });

      return toolResult({
        ...resourceMeta(def, metaFilters),
        data: result.records,
        total: result.total,
      });
    },
  );
}

export function registerResourceTools(server: McpServer, env: Env): void {
  for (const def of RESOURCE_TOOL_DEFS) {
    registerOne(server, env, def);
  }
}

export { RESOURCE_TOOL_NAMES } from "./resource-catalog";
