import { RESOURCE_TOOL_DEFS, type ResourceToolDef } from "./resource-catalog";

export const INDIA_SCOPE = "in";

export const NORTHEAST_CODES = ["ar", "as", "mn", "ml", "mz", "nl", "sk", "tr"] as const;

export interface StateProfile {
  code: string;
  name: string;
  defaultCity: string;
}

export const STATE_PROFILES: Record<string, StateProfile> = {
  ap: { code: "ap", name: "Andhra Pradesh", defaultCity: "Vijayawada" },
  ar: { code: "ar", name: "Arunachal Pradesh", defaultCity: "Itanagar" },
  as: { code: "as", name: "Assam", defaultCity: "Guwahati" },
  br: { code: "br", name: "Bihar", defaultCity: "Patna" },
  ct: { code: "ct", name: "Chhattisgarh", defaultCity: "Raipur" },
  ga: { code: "ga", name: "Goa", defaultCity: "Panaji" },
  gj: { code: "gj", name: "Gujarat", defaultCity: "Ahmedabad" },
  hr: { code: "hr", name: "Haryana", defaultCity: "Chandigarh" },
  hp: { code: "hp", name: "Himachal Pradesh", defaultCity: "Shimla" },
  jh: { code: "jh", name: "Jharkhand", defaultCity: "Ranchi" },
  ka: { code: "ka", name: "Karnataka", defaultCity: "Bengaluru" },
  kl: { code: "kl", name: "Kerala", defaultCity: "Thiruvananthapuram" },
  mp: { code: "mp", name: "Madhya Pradesh", defaultCity: "Bhopal" },
  mh: { code: "mh", name: "Maharashtra", defaultCity: "Mumbai" },
  mn: { code: "mn", name: "Manipur", defaultCity: "Imphal" },
  ml: { code: "ml", name: "Meghalaya", defaultCity: "Shillong" },
  mz: { code: "mz", name: "Mizoram", defaultCity: "Aizawl" },
  nl: { code: "nl", name: "Nagaland", defaultCity: "Kohima" },
  or: { code: "or", name: "Odisha", defaultCity: "Bhubaneswar" },
  pb: { code: "pb", name: "Punjab", defaultCity: "Chandigarh" },
  rj: { code: "rj", name: "Rajasthan", defaultCity: "Jaipur" },
  sk: { code: "sk", name: "Sikkim", defaultCity: "Gangtok" },
  tn: { code: "tn", name: "Tamil Nadu", defaultCity: "Chennai" },
  tg: { code: "tg", name: "Telangana", defaultCity: "Hyderabad" },
  tr: { code: "tr", name: "Tripura", defaultCity: "Agartala" },
  up: { code: "up", name: "Uttar Pradesh", defaultCity: "Lucknow" },
  ut: { code: "ut", name: "Uttarakhand", defaultCity: "Dehradun" },
  wb: { code: "wb", name: "West Bengal", defaultCity: "Kolkata" },
  an: { code: "an", name: "Andaman and Nicobar Islands", defaultCity: "Port Blair" },
  ch: { code: "ch", name: "Chandigarh", defaultCity: "Chandigarh" },
  dn: { code: "dn", name: "Dadra and Nagar Haveli and Daman and Diu", defaultCity: "Daman" },
  dl: { code: "dl", name: "Delhi", defaultCity: "Delhi" },
  jk: { code: "jk", name: "Jammu and Kashmir", defaultCity: "Srinagar" },
  la: { code: "la", name: "Ladakh", defaultCity: "Leh" },
  ld: { code: "ld", name: "Lakshadweep", defaultCity: "Kavaratti" },
  py: { code: "py", name: "Puducherry", defaultCity: "Puducherry" },
};

const NORTHEAST_SET = new Set<string>(NORTHEAST_CODES);

/** Location utilities available on every MCP face. */
export const SHARED_CORE_TOOLS = [
  "in_weather_2h",
  "in_weather_24h",
  "in_weather_4day",
  "in_uv_index",
  "in_air_temperature",
  "in_relative_humidity",
  "in_address_search",
  "in_geocode",
  "in_reverse_geocode",
  "in_ifsc_lookup",
  "in_elevation",
] as const;

/** National catalogue and nationwide (not state-grain) extras. */
export const INDIA_ONLY_CORE_TOOLS = [
  "in_datasets_search",
  "in_dataset_metadata",
  "in_dataset_query",
  "in_fx_rate",
  "in_holidays",
  "in_earthquakes",
  "in_cricket_live",
  "in_cricket_matches",
] as const;

/** State-grain core tools; locked to the MCP's state. */
export const STATE_CORE_TOOLS = [
  "in_rainfall",
  "in_air_quality",
  "in_mandi_prices",
  "in_hospital_directory",
  "in_postal_code",
] as const;

export const EXCLUSIVE_CORE_TOOLS: Record<string, readonly string[]> = {
  ka: ["in_bus_stops", "in_bus_services", "in_bus_routes"],
};

export function hasNamedFilter(def: ResourceToolDef, argName: string): boolean {
  return (def.filters ?? []).some((filter) => (filter.name ?? filter.field) === argName);
}

export function hasStateFilter(def: ResourceToolDef): boolean {
  return hasNamedFilter(def, "state");
}

export function isResourceToolOnScope(def: ResourceToolDef, scopeCode: string): boolean {
  if (def.exclusiveTo === "northeast") {
    return NORTHEAST_SET.has(scopeCode);
  }
  if (def.exclusiveTo) {
    return scopeCode === def.exclusiveTo;
  }
  if (hasStateFilter(def)) {
    return scopeCode !== INDIA_SCOPE;
  }
  return scopeCode === INDIA_SCOPE;
}

export function parseScopeCode(raw?: string | null): string | undefined {
  const code = raw?.trim().toLowerCase();
  if (!code || code === INDIA_SCOPE || code === "india") {
    return INDIA_SCOPE;
  }
  if (STATE_PROFILES[code]) {
    return code;
  }
  return undefined;
}

export function parseMcpPath(pathname: string): { ok: true; code: string } | { ok: false; reason: string } {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/mcp") {
    return { ok: true, code: INDIA_SCOPE };
  }
  const match = path.match(/^\/mcp\/([^/]+)$/);
  if (!match) {
    return { ok: false, reason: "Not an MCP path" };
  }
  const code = parseScopeCode(match[1]);
  if (!code) {
    return { ok: false, reason: `Unknown scope '${match[1]}'. Use /mcp (India) or /mcp/{state} e.g. /mcp/tn.` };
  }
  return { ok: true, code };
}

export function getStateProfile(scopeCode: string): StateProfile | undefined {
  if (scopeCode === INDIA_SCOPE) {
    return undefined;
  }
  return STATE_PROFILES[scopeCode];
}

export function boundStateName(scopeCode: string): string | undefined {
  return getStateProfile(scopeCode)?.name;
}

export function defaultCityForScope(scopeCode: string): string {
  return getStateProfile(scopeCode)?.defaultCity ?? "Delhi";
}

export function listScopeEndpoints(origin: string): Array<{ code: string; name: string; mcp: string }> {
  return [
    { code: INDIA_SCOPE, name: "India (national)", mcp: `${origin}/mcp` },
    ...Object.values(STATE_PROFILES).map((state) => ({
      code: state.code,
      name: state.name,
      mcp: `${origin}/mcp/${state.code}`,
    })),
  ];
}

export function toolNamesForScope(scopeCode: string): string[] {
  const names = new Set<string>(SHARED_CORE_TOOLS);
  if (scopeCode === INDIA_SCOPE) {
    for (const name of INDIA_ONLY_CORE_TOOLS) {
      names.add(name);
    }
  } else {
    for (const name of STATE_CORE_TOOLS) {
      names.add(name);
    }
    for (const name of EXCLUSIVE_CORE_TOOLS[scopeCode] ?? []) {
      names.add(name);
    }
  }
  for (const def of RESOURCE_TOOL_DEFS) {
    if (isResourceToolOnScope(def, scopeCode)) {
      names.add(def.name);
    }
  }
  return [...names];
}

export function mcpServerTitle(envName: string, scopeCode: string): string {
  if (scopeCode === INDIA_SCOPE) {
    return `${envName} — India`;
  }
  const profile = STATE_PROFILES[scopeCode];
  return profile ? `${envName} — ${profile.name}` : envName;
}
