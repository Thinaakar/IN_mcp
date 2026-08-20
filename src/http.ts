import type { Env } from "./env";

const DEFAULT_TIMEOUT_MS = 10000;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,mcp-session-id,Last-Event-ID,mcp-protocol-version,Authorization",
  "Access-Control-Expose-Headers": "mcp-session-id,mcp-protocol-version",
};

function timeoutMs(env?: Env): number {
  const configured = Number(env?.TOOL_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeout = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(`Timed out after ${timeout}ms`), timeout);

  try {
    return await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Upstream request timed out after ${timeout}ms: ${new URL(url).hostname}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...init.headers,
    },
  });
}

export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function fetchJson<T>(url: string, env: Env, init: RequestInit = {}, timeoutOverrideMs?: number): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("User-Agent", "Monstarx-India-MCP/0.1");

  if (env.DATA_GOV_IN_API_KEY && new URL(url).hostname.endsWith("data.gov.in")) {
    headers.set("x-api-key", env.DATA_GOV_IN_API_KEY);
  }

  const response = await fetchWithTimeout(url, { ...init, headers }, timeoutOverrideMs ?? timeoutMs(env));
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status} ${response.statusText}`);
  }

  if (!contentType.includes("json")) {
    throw new Error(`Upstream returned non-JSON content from ${new URL(url).hostname}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchJsonBody<T>(url: string, init: RequestInit = {}, timeout = DEFAULT_TIMEOUT_MS): Promise<T> {
  const response = await fetchWithTimeout(url, init, timeout);

  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function indiaMcpHeaders(init: RequestInit = {}): Headers {
  const headers = new Headers(init.headers);
  headers.set("User-Agent", "Monstarx-India-MCP/0.1");
  return headers;
}

export async function fetchText(url: string, env: Env, init: RequestInit = {}, timeoutOverrideMs?: number): Promise<string> {
  const response = await fetchWithTimeout(url, { ...init, headers: indiaMcpHeaders(init) }, timeoutOverrideMs ?? timeoutMs(env));

  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}
