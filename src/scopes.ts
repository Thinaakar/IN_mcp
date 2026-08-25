import { RESOURCE_TOOL_DEFS, type ResourceToolDef } from "./resource-catalog";

export const INDIA_SCOPE = "in";

/** India's 28 states (no union territories). */
export const STATE_CODES_28 = [
  "ap",
  "ar",
  "as",
  "br",
  "ct",
  "ga",
  "gj",
  "hr",
  "hp",
  "jh",
  "ka",
  "kl",
  "mp",
  "mh",
  "mn",
  "ml",
  "mz",
  "nl",
  "or",
  "pb",
  "rj",
  "sk",
  "tn",
  "tg",
  "tr",
  "up",
  "ut",
  "wb",
] as const;

export type StateCode28 = (typeof STATE_CODES_28)[number];

export const NORTHEAST_CODES = ["ar", "as", "mn", "ml", "mz", "nl", "sk", "tr"] as const;

export interface StateProfile {
  code: string;
  name: string;
  defaultCity: string;
}

/** 28 states plus UTs (UTs are for `state` argument spelling only, not catalog faces). */
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

/** Common location + national extras (no `state` required). */
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

/** Catalog explorer tools — registered on MCP, documented in playground sidebar, not listed as National. */
export const SIDEBAR_ONLY_CORE_TOOLS = [
  "in_datasets_search",
  "in_dataset_metadata",
  "in_dataset_query",
] as const;

export const INDIA_ONLY_CORE_TOOLS = [
  "in_fx_rate",
  "in_holidays",
  "in_earthquakes",
  "in_cricket_live",
  "in_cricket_matches",
] as const;

/** Shared tools that accept optional `state` (or equivalent) in arguments. */
export const STATE_CORE_TOOLS = [
  "in_rainfall",
  "in_air_quality",
  "in_mandi_prices",
  "in_hospital_directory",
  "in_postal_code",
] as const;

/** State-exclusive core tools: `{code}_{topic}` — no `in_` prefix. */
const KA_EXCLUSIVE = ["ka_bus_stops", "ka_bus_services", "ka_bus_routes", "ka_open_data"] as const;

export const EXCLUSIVE_CORE_TOOLS: Record<string, readonly string[]> = Object.fromEntries(
  STATE_CODES_28.map((code) => [code, code === "ka" ? [...KA_EXCLUSIVE] : [`${code}_open_data`]]),
);

export function catalogKeyFor(code: string): string {
  const profile = STATE_PROFILES[code];
  if (!profile) {
    return code;
  }
  return profile.name.toLowerCase().replace(/[^a-z]/g, "");
}

export function hasNamedFilter(def: ResourceToolDef, argName: string): boolean {
  return (def.filters ?? []).some((filter) => (filter.name ?? filter.field) === argName);
}

export function hasStateFilter(def: ResourceToolDef): boolean {
  return hasNamedFilter(def, "state");
}

export function isExclusiveResource(def: ResourceToolDef): boolean {
  return Boolean(def.exclusiveTo);
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

/** Client-facing MCP path is `/mcp` only. `/mcp/in` is accepted as an alias. */
export function parseMcpPath(pathname: string): { ok: true; code: string } | { ok: false; reason: string } {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/mcp" || path === "/mcp/in") {
    return { ok: true, code: INDIA_SCOPE };
  }
  const match = path.match(/^\/mcp\/([^/]+)$/);
  if (!match) {
    return { ok: false, reason: "Not an MCP path" };
  }
  return {
    ok: false,
    reason:
      'Per-state MCP paths are removed. Use POST /mcp with optional "state" on shared tools, or exclusive names like tn_water_bodies_census / ka_bus_routes.',
  };
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

export function exclusiveToolsByCode(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const [code, names] of Object.entries(EXCLUSIVE_CORE_TOOLS)) {
    map[code] = [...names];
  }
  for (const def of RESOURCE_TOOL_DEFS) {
    const code = def.exclusiveTo;
    if (!code) {
      continue;
    }
    map[code] ??= [];
    map[code].push(def.name);
  }
  return map;
}

/** National tools with no `state` argument (weather, FX, geocode, …). */
export function commonToolsList(): string[] {
  const resourceCommon = RESOURCE_TOOL_DEFS.filter((def) => !isExclusiveResource(def) && !hasStateFilter(def)).map(
    (def) => def.name,
  );
  return [...new Set([...SHARED_CORE_TOOLS, ...INDIA_ONLY_CORE_TOOLS, ...resourceCommon])];
}

/** National tools that accept optional `state` (mandi, rainfall, crime, …). */
export function sharedToolsList(): string[] {
  const resourceShared = RESOURCE_TOOL_DEFS.filter((def) => !isExclusiveResource(def) && hasStateFilter(def)).map(
    (def) => def.name,
  );
  return [...new Set([...STATE_CORE_TOOLS, ...resourceShared])];
}

/** Union of common + shared (everything except state exclusives). */
export function allToolsList(): string[] {
  return [...new Set([...commonToolsList(), ...sharedToolsList()])];
}

export function allRegisteredToolNames(): string[] {
  const exclusive = Object.values(exclusiveToolsByCode()).flat();
  return [...new Set([...allToolsList(), ...SIDEBAR_ONLY_CORE_TOOLS, ...exclusive])];
}

export function statesCatalogMap(): Record<string, { name: string; key: string }> {
  const states: Record<string, { name: string; key: string }> = {};
  for (const code of STATE_CODES_28) {
    const profile = STATE_PROFILES[code];
    states[code] = { name: profile.name, key: catalogKeyFor(code) };
  }
  return states;
}

export type PublicCatalog = {
  name: string;
  version: string;
  mcp: string;
  health: string;
  /** National — no `state` filter (weather, FX, geocode, national tables). */
  national: string[];
  /** Shared — optional `state` filter (mandi, AQI, crime, DILRMP, …). */
  shared: string[];
  /**
   * Exclusive — state-only tools keyed by catalog name (`andhrapradesh`, …).
   * Includes `{code}_open_data` explorers plus fixed domain tools (`ap_procurement`, `ka_bus_stops`, …).
   */
  exclusive: Record<string, string[]>;
};

export function buildPublicCatalog(opts: { name: string; version: string; origin: string }): PublicCatalog {
  const byCode = exclusiveToolsByCode();
  const national = commonToolsList();
  const shared = sharedToolsList();

  const exclusive: Record<string, string[]> = {};
  const codes = [...new Set([...STATE_CODES_28, ...Object.keys(byCode)])].sort((a, b) => {
    const na = STATE_PROFILES[a]?.name ?? a;
    const nb = STATE_PROFILES[b]?.name ?? b;
    return na.localeCompare(nb);
  });
  for (const code of codes) {
    exclusive[catalogKeyFor(code)] = [...new Set(byCode[code] ?? [])];
  }

  return {
    name: opts.name,
    version: opts.version,
    mcp: `${opts.origin}/mcp`,
    health: `${opts.origin}/health`,
    national,
    shared,
    exclusive,
  };
}

/** @deprecated Path faces are gone; kept for tests that inspect grouping. */
export function toolNamesForScope(scopeCode: string): string[] {
  if (scopeCode === INDIA_SCOPE) {
    return allRegisteredToolNames();
  }
  const exclusive = exclusiveToolsByCode()[scopeCode] ?? [];
  return [...allToolsList(), ...exclusive];
}
