import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { Env } from "./env";
import { queryDataGovResource } from "./data-gov";
import { RESOURCE_TOOL_DEFS, type ResourceToolDef } from "./resource-catalog";
import { boundStateName, hasNamedFilter, INDIA_SCOPE, isResourceToolOnScope } from "./scopes";

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

function buildInputSchema(def: ResourceToolDef, bound: { state?: string }): Record<string, z.ZodType> {
  const schema: Record<string, z.ZodType> = {
    limit: z.number().int().min(1).max(1000).default(100).describe("Maximum rows to return."),
    offset: z.number().int().min(0).default(0).describe("Row offset for pagination."),
  };

  for (const filter of def.filters ?? []) {
    const name = filter.name ?? filter.field;
    if (name === "state" && bound.state) {
      continue;
    }
    schema[name] = z.string().optional().describe(filter.describe);
  }

  return schema;
}

function registerOne(
  server: McpServer,
  env: Env,
  def: ResourceToolDef,
  bound: { state?: string; scope: string },
): void {
  const inputSchema = buildInputSchema(def, bound);
  const lockedNote = bound.state ? ` Locked to ${bound.state}.` : "";

  server.registerTool(
    def.name,
    {
      title: def.title,
      description: `${def.description}${lockedNote}`,
      inputSchema,
    },
    async (args) => {
      const limit = typeof args.limit === "number" ? args.limit : 100;
      const offset = typeof args.offset === "number" ? args.offset : 0;
      const filters: Record<string, string | undefined> = {};
      const metaFilters: Record<string, unknown> = { mcp_scope: bound.scope };

      for (const filter of def.filters ?? []) {
        const name = filter.name ?? filter.field;
        let value = typeof args[name] === "string" ? args[name].trim() : "";
        if (name === "state" && bound.state) {
          value = bound.state;
        }
        if (value) {
          filters[filter.field] = value;
          metaFilters[name] = value;
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

export function registerResourceTools(server: McpServer, env: Env, scopeCode = INDIA_SCOPE): void {
  const state = boundStateName(scopeCode);
  for (const def of RESOURCE_TOOL_DEFS) {
    if (!isResourceToolOnScope(def, scopeCode)) {
      continue;
    }
    registerOne(server, env, def, {
      scope: scopeCode,
      state: hasNamedFilter(def, "state") ? state : undefined,
    });
  }
}

export { RESOURCE_TOOL_NAMES } from "./resource-catalog";
