import type { Env } from "./env";
import { fetchJson } from "./http";

const MAPS_BASE_URL = "https://nominatim.openstreetmap.org";

export interface MapsSearchResponse {
  found?: number;
  totalNumPages?: number;
  pageNum?: number;
  results?: Array<Record<string, string>>;
  error?: string;
}

export interface MapsReverseGeocodeResponse {
  GeocodeInfo?: Array<Record<string, string>>;
  message?: string;
}

function toStringRecord(item: Record<string, unknown>): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(item)) {
    if (value !== undefined && value !== null && typeof value !== "object") {
      record[key] = String(value);
    }
  }
  return record;
}

export async function searchMapsAddress(env: Env, searchValue: string, page = 1): Promise<MapsSearchResponse> {
  const pageSize = 10;
  const url = new URL(`${MAPS_BASE_URL}/search`);
  url.searchParams.set("q", searchValue);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("limit", String(pageSize));
  url.searchParams.set("offset", String(Math.max(page - 1, 0) * pageSize));

  const results = (await fetchJson<Array<Record<string, unknown>>>(url.toString(), env)).map(toStringRecord);

  return {
    found: results.length,
    totalNumPages: results.length < pageSize ? page : page + 1,
    pageNum: page,
    results,
  };
}

export async function reverseGeocodeMaps(
  env: Env,
  latitude: number,
  longitude: number,
  _buffer = 40,
  _addressType = "All",
): Promise<MapsReverseGeocodeResponse> {
  const url = new URL(`${MAPS_BASE_URL}/reverse`);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");

  const result = await fetchJson<Record<string, unknown>>(url.toString(), env);

  return {
    GeocodeInfo: [toStringRecord(result)],
  };
}
