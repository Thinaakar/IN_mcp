import type { Env } from "./env";
import { fetchJson } from "./http";

const USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";

export const INDIA_EARTHQUAKE_BOUNDS = {
  minlatitude: 6,
  maxlatitude: 38,
  minlongitude: 68,
  maxlongitude: 98,
} as const;

export interface EarthquakeEvent {
  id?: string;
  magnitude?: number;
  place?: string;
  time?: string;
  longitude?: number;
  latitude?: number;
  depth_km?: number;
  url?: string;
}

export interface EarthquakeQuery {
  minmagnitude?: number;
  starttime?: string;
  endtime?: string;
  limit?: number;
}

interface UsgsGeoJson {
  metadata?: { count?: number; title?: string };
  features?: Array<{
    id?: string;
    properties?: {
      mag?: number;
      place?: string;
      time?: number;
      url?: string;
    };
    geometry?: {
      coordinates?: number[];
    };
  }>;
}

function toIso(timestamp?: number): string | undefined {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return undefined;
  }
  return new Date(timestamp).toISOString();
}

export function slimEarthquakeFeatures(payload: UsgsGeoJson): EarthquakeEvent[] {
  return (payload.features ?? []).map((feature) => {
    const [longitude, latitude, depth] = feature.geometry?.coordinates ?? [];
    return {
      id: feature.id,
      magnitude: feature.properties?.mag,
      place: feature.properties?.place,
      time: toIso(feature.properties?.time),
      longitude,
      latitude,
      depth_km: depth,
      url: feature.properties?.url,
    };
  });
}

export async function getIndiaEarthquakes(env: Env, options: EarthquakeQuery = {}): Promise<{
  bounds: typeof INDIA_EARTHQUAKE_BOUNDS;
  count: number;
  events: EarthquakeEvent[];
}> {
  const url = new URL(USGS_URL);
  url.searchParams.set("format", "geojson");
  url.searchParams.set("orderby", "time");
  url.searchParams.set("minmagnitude", String(options.minmagnitude ?? 4));
  url.searchParams.set("minlatitude", String(INDIA_EARTHQUAKE_BOUNDS.minlatitude));
  url.searchParams.set("maxlatitude", String(INDIA_EARTHQUAKE_BOUNDS.maxlatitude));
  url.searchParams.set("minlongitude", String(INDIA_EARTHQUAKE_BOUNDS.minlongitude));
  url.searchParams.set("maxlongitude", String(INDIA_EARTHQUAKE_BOUNDS.maxlongitude));
  url.searchParams.set("limit", String(Math.min(options.limit ?? 50, 1000)));
  if (options.starttime) {
    url.searchParams.set("starttime", options.starttime);
  }
  if (options.endtime) {
    url.searchParams.set("endtime", options.endtime);
  }

  const payload = await fetchJson<UsgsGeoJson>(url.toString(), env);
  const events = slimEarthquakeFeatures(payload);
  return {
    bounds: INDIA_EARTHQUAKE_BOUNDS,
    count: events.length,
    events,
  };
}
