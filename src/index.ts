import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Env } from "./env";
import { corsHeaders, jsonResponse, withCors } from "./http";
import { createMcpServer, toolNames } from "./tools";

function serverInfo(env: Env, request: Request) {
  const url = new URL(request.url);

  return {
    name: env.MCP_SERVER_NAME,
    version: env.MCP_SERVER_VERSION,
    build_sha: env.BUILD_SHA ?? "local",
    environment: env.ENVIRONMENT,
    protocol: "Model Context Protocol",
    transport: "Streamable HTTP",
    endpoints: {
      info: `${url.origin}/`,
      health: `${url.origin}/health`,
      mcp: `${url.origin}/mcp`,
    },
    tools: toolNames,
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

    if (url.pathname === "/mcp") {
      const startedAt = Date.now();
      const requestMetadata = await readMcpRequestMetadata(request);
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      const server = createMcpServer(env);
      await server.connect(transport);

      try {
        const response = await transport.handleRequest(request);
        await logMcpRequest(request, response, startedAt, requestMetadata);
        return withCors(response);
      } catch (error) {
        console.error(
          JSON.stringify({
            event: "mcp_request_exception",
            path: url.pathname,
            duration_ms: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error),
            ...requestMetadata,
          }),
        );
        throw error;
      } finally {
        await server.close();
      }
    }

    return jsonResponse({ error: "Not found" }, { status: 404 });
  },
};
