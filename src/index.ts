import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Env } from "./env";
import { corsHeaders, jsonResponse, withCors } from "./http";
import { INDIA_SCOPE, listScopeEndpoints, mcpServerTitle, parseMcpPath, toolNamesForScope } from "./scopes";
import { createMcpServer, toolNames } from "./tools";

function serverInfo(env: Env, request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  return {
    name: env.MCP_SERVER_NAME,
    version: env.MCP_SERVER_VERSION,
    build_sha: env.BUILD_SHA ?? "local",
    environment: env.ENVIRONMENT,
    protocol: "Model Context Protocol",
    transport: "Streamable HTTP",
    endpoints: {
      info: `${origin}/`,
      health: `${origin}/health`,
      scopes: `${origin}/scopes`,
      india_mcp: `${origin}/mcp`,
    },
    scopes: listScopeEndpoints(origin),
    tools: toolNamesForScope(INDIA_SCOPE),
    all_tools: toolNames,
  };
}

async function readMcpRequestMetadata(request: Request): Promise<Record<string, unknown>> {
  if (request.method !== "POST") {
    return { method: request.method };
  }

  try {
    const body = (await request.clone().json()) as {
      method?: string;
      id?: string | number;
      params?: {
        name?: string;
      };
    };

    return {
      rpc_method: body.method,
      rpc_id: body.id,
      tool_name: body.params?.name,
    };
  } catch {
    return { rpc_method: "unknown" };
  }
}

async function logMcpRequest(request: Request, response: Response, startedAt: number, metadata: Record<string, unknown>): Promise<void> {
  const durationMs = Date.now() - startedAt;
  let rpcError: unknown;
  let toolError = false;

  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
      const body = (await response.clone().json()) as {
        error?: unknown;
        result?: {
          isError?: boolean;
        };
      };
      rpcError = body.error;
      toolError = Boolean(body.result?.isError);
    }
  } catch {
    // Logging must never affect the MCP response.
  }

  const logPayload = {
    event: "mcp_request",
    path: new URL(request.url).pathname,
    http_method: request.method,
    status: response.status,
    duration_ms: durationMs,
    tool_error: toolError,
    rpc_error: Boolean(rpcError),
    ...metadata,
  };

  if (response.ok && !rpcError && !toolError) {
    console.log(JSON.stringify(logPayload));
  } else {
    console.error(JSON.stringify(logPayload));
  }
}

async function handleMcp(request: Request, env: Env, scopeCode: string): Promise<Response> {
  const startedAt = Date.now();
  const requestMetadata = await readMcpRequestMetadata(request);

  // Stateless JSON mode: do not open a hanging GET SSE stream. Cursor falls back
  // to legacy SSE when streamable HTTP fails; an empty event-stream 200 never
  // emits `event: endpoint`, so live tool discovery times out.
  if (request.method === "GET") {
    return jsonResponse(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method Not Allowed. This MCP endpoint is Streamable HTTP; use POST.",
        },
        id: null,
      },
      { status: 405, headers: { Allow: "POST, DELETE, OPTIONS" } },
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createMcpServer(env, scopeCode);
  await server.connect(transport);

  try {
    const response = await transport.handleRequest(request);
    await logMcpRequest(request, response, startedAt, { ...requestMetadata, mcp_scope: scopeCode });
    return withCors(response);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "mcp_request_exception",
        path: new URL(request.url).pathname,
        duration_ms: Date.now() - startedAt,
        mcp_scope: scopeCode,
        error: error instanceof Error ? error.message : String(error),
        ...requestMetadata,
      }),
    );
    throw error;
  } finally {
    await server.close();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return jsonResponse(serverInfo(env, request));
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return jsonResponse({
        status: "ok",
        environment: env.ENVIRONMENT,
        version: env.MCP_SERVER_VERSION,
        build_sha: env.BUILD_SHA ?? "local",
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/scopes" && request.method === "GET") {
      return jsonResponse({
        india: {
          code: INDIA_SCOPE,
          name: mcpServerTitle(env.MCP_SERVER_NAME, INDIA_SCOPE),
          mcp: `${url.origin}/mcp`,
          tools: toolNamesForScope(INDIA_SCOPE),
        },
        states: listScopeEndpoints(url.origin).filter((item) => item.code !== INDIA_SCOPE),
      });
    }

    const mcpPath = parseMcpPath(url.pathname);
    if (mcpPath.ok) {
      return handleMcp(request, env, mcpPath.code);
    }

    if (url.pathname.startsWith("/mcp/")) {
      return jsonResponse(
        {
          error: mcpPath.reason,
          scopes: listScopeEndpoints(url.origin),
        },
        { status: 404 },
      );
    }

    return jsonResponse({ error: "Not found" }, { status: 404 });
  },
};
