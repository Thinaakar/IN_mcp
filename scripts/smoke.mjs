#!/usr/bin/env node

const ENDPOINTS = {
  staging: "https://in-mcp-staging.monstarxapp.com/mcp",
  production: "https://in-mcp.monstarxapp.com/mcp",
  local: "http://localhost:8787/mcp",
};

const CPCB_AQI_DATASET_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

const smokeCases = [
  ["in_datasets_search", { query: "air quality", page: 1 }],
  ["in_dataset_metadata", { dataset_id: CPCB_AQI_DATASET_ID }],
  ["in_dataset_query", { dataset_id: CPCB_AQI_DATASET_ID, limit: 1 }],
  ["in_weather_2h", { city: "Delhi" }],
  ["in_weather_24h", { city: "Delhi" }],
  ["in_weather_4day", { city: "Mumbai" }],
  ["in_uv_index", { city: "Delhi" }],
  ["in_rainfall", { city: "Delhi" }],
  ["in_air_temperature", { city: "Delhi" }],
  ["in_relative_humidity", { city: "Delhi" }],
  ["in_air_quality", { city: "Delhi" }],
  ["in_address_search", { query: "India Gate", page: 1 }],
  ["in_geocode", { query: "India Gate Delhi", limit: 1 }],
  ["in_reverse_geocode", { latitude: 28.6129, longitude: 77.2295, buffer: 40 }],
  ["in_bus_stops", { skip: 0, limit: 5 }],
  ["in_bus_services", { skip: 0, limit: 5 }],
  ["in_mandi_prices", { commodity: "Tomato", limit: 5 }],
  ["in_hospital_directory", { state: "Delhi", limit: 5 }],
  ["in_ifsc_lookup", { city: "NAMAKKAL", limit: 10 }],
  ["in_fx_rate", { base: "USD", symbols: "INR" }],
  ["in_holidays", { year: 2026 }],
  ["in_earthquakes", { minmagnitude: 4, limit: 5 }],
  ["in_cricket_live", { offset: 0 }],
  ["in_cricket_matches", { offset: 0 }],
  ["in_elevation", { city: "Delhi" }],
  ["in_postal_code", { pincode: "110001", limit: 5 }],
  ["in_dilrmp_clr", { state: "Karnataka", limit: 5 }],
  ["in_fta_by_age", { limit: 5 }],
  ["in_railway_route_km", { limit: 5 }],
  ["in_fuel_prices_delhi", { limit: 5 }],
  ["in_crime_ipc_by_state", { state: "Karnataka", limit: 5 }],
  ["in_renewable_energy_share", { limit: 5 }],
];

const target = process.argv[2] ?? "staging";
const endpoint = ENDPOINTS[target] ?? target;

let nextId = 1;

async function rpc(method, params) {
  const id = nextId++;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  const payload = JSON.parse(text);
  if (payload.error) {
    throw new Error(`${payload.error.code}: ${payload.error.message}`);
  }

  return payload.result;
}

async function withTimeout(label, promise, timeoutMs = 30000) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}

function assertToolResult(toolName, result) {
  if (!result || typeof result !== "object") {
    throw new Error(`${toolName} returned an empty result`);
  }
  if (result.isError) {
    const text = result.content?.[0]?.text ?? "unknown tool error";
    throw new Error(`${toolName} returned MCP tool error: ${text}`);
  }
  if (!Array.isArray(result.content) || result.content.length === 0) {
    throw new Error(`${toolName} returned no content`);
  }
}

async function main() {
  console.log(`Smoke testing ${endpoint}`);

  const toolsResult = await withTimeout("tools/list", rpc("tools/list"));
  const listedTools = toolsResult.tools?.map((tool) => tool.name) ?? [];
  const missingTools = smokeCases.map(([name]) => name).filter((name) => !listedTools.includes(name));

  if (missingTools.length > 0) {
    throw new Error(`tools/list missing expected tools: ${missingTools.join(", ")}`);
  }

  console.log(`tools/list ok (${listedTools.length} tools)`);

  const failures = [];
  for (const [toolName, args] of smokeCases) {
    const started = Date.now();
    try {
      const result = await withTimeout(toolName, rpc("tools/call", { name: toolName, arguments: args }));
      assertToolResult(toolName, result);
      console.log(`PASS ${toolName} ${Date.now() - started}ms`);
    } catch (error) {
      failures.push({ toolName, error });
      console.error(`FAIL ${toolName}: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} smoke test(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${smokeCases.length} smoke tests passed.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
