import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { Env } from "./env";
import { CPCB_AQI_RESOURCE_ID, DISTRICT_RAINFALL_RESOURCE_ID, HOSPITAL_DIRECTORY_RESOURCE_ID, MANDI_PRICES_RESOURCE_ID, PINCODE_CATALOG_ID, PINCODE_RESOURCE_ID, getAirQualityApi, getCpcbAirQuality, getDatasetMetadata, getDistrictRainfall, getHospitalDirectory, getMandiPrices, getPincodeDirectory, getRealtimeApi, listDatasets, queryDataset } from "./data-gov";
import { getCurrentCricketMatches, getCricketMatches } from "./cricket";
import { getIndiaEarthquakes } from "./earthquakes";
import { getFxRates } from "./fx";
import { getIndiaHolidays } from "./holidays";
import { lookupIfsc, searchIfsc } from "./ifsc";
import { reverseGeocodeMaps, searchMapsAddress } from "./maps";
import { registerResourceTools, RESOURCE_TOOL_NAMES } from "./resource-tools";
import { listBusRoutes, listBusServices, listBusStops } from "./transit";

const DEFAULT_CITY = "Delhi";

const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  delhi: { latitude: 28.6139, longitude: 77.209 },
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
  kolkata: { latitude: 22.5726, longitude: 88.3639 },
  hyderabad: { latitude: 17.385, longitude: 78.4867 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  ahmedabad: { latitude: 23.0225, longitude: 72.5714 },
  jaipur: { latitude: 26.9124, longitude: 75.7873 },
};

export const toolNames = [
  "in_datasets_search",
  "in_dataset_metadata",
  "in_dataset_query",
  "in_weather_2h",
  "in_weather_24h",
  "in_weather_4day",
  "in_uv_index",
  "in_rainfall",
  "in_air_temperature",
  "in_relative_humidity",
  "in_air_quality",
  "in_address_search",
  "in_geocode",
  "in_reverse_geocode",
  "in_bus_stops",
  "in_bus_services",
  "in_bus_routes",
  "in_mandi_prices",
  "in_hospital_directory",
  "in_ifsc_lookup",
  "in_fx_rate",
  "in_holidays",
  "in_earthquakes",
  "in_cricket_live",
  "in_cricket_matches",
  "in_elevation",
  "in_postal_code",
  ...RESOURCE_TOOL_NAMES,
] as const;

type ToolPayload = Record<string, unknown>;

function nowIso(): string {
  return new Date().toISOString();
}

export function toolResult(payload: ToolPayload) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  };
}

function sourceMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "data.gov.in",
    retrieved_at: nowIso(),
    license: "Government Open Data License - India",
    ...extra,
  };
}

function mapsMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "OpenStreetMap Nominatim",
    retrieved_at: nowIso(),
    agency: "OSM",
    ...extra,
  };
}

function transitMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "BMTC GTFS (static CSV)",
    retrieved_at: nowIso(),
    agency: "BMTC",
    ...extra,
  };
}

function weatherMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "Open-Meteo",
    retrieved_at: nowIso(),
    agency: "IMD-compatible forecast",
    ...extra,
  };
}

function cpcbMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "CPCB",
    retrieved_at: nowIso(),
    agency: "Central Pollution Control Board",
    api: "data.gov.in",
    ...extra,
  };
}

function rainfallMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "IMD",
    retrieved_at: nowIso(),
    agency: "India Meteorological Department",
    api: "data.gov.in",
    ...extra,
  };
}

function pincodeMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "India Post",
    retrieved_at: nowIso(),
    agency: "Department of Posts",
    api: "data.gov.in",
    catalog_id: PINCODE_CATALOG_ID,
    dataset_id: PINCODE_RESOURCE_ID,
    ...extra,
  };
}

function mandiMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "Agmarknet",
    retrieved_at: nowIso(),
    agency: "Ministry of Agriculture",
    api: "data.gov.in",
    ...extra,
  };
}

function hospitalMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "National Health Portal",
    retrieved_at: nowIso(),
    agency: "Ministry of Health and Family Welfare",
    api: "data.gov.in",
    ...extra,
  };
}

function ifscMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "Razorpay IFSC",
    retrieved_at: nowIso(),
    agency: "Razorpay (community IFSC dataset)",
    api: "ifsc.razorpay.com",
    ...extra,
  };
}

function fxMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    retrieved_at: nowIso(),
    ...extra,
  };
}

function holidayMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "Tallyfy National Holidays",
    retrieved_at: nowIso(),
    agency: "Community (not Government of India gazette)",
    api: "tallyfy.com/national-holidays",
    ...extra,
  };
}

function earthquakeMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "USGS",
    retrieved_at: nowIso(),
    agency: "U.S. Geological Survey",
    api: "earthquake.usgs.gov",
    ...extra,
  };
}

function cricketMeta(extra: ToolPayload = {}): ToolPayload {
  return {
    source: "CricAPI / CricketData.org",
    retrieved_at: nowIso(),
    agency: "CricAPI (not BCCI/ICC official)",
    api: "api.cricapi.com/v1",
    ...extra,
  };
}

function pincodeLookupOptions(query: string): { pincode?: string; officename?: string } {
  const trimmed = query.trim();
  if (/^\d{6}$/.test(trimmed)) {
    return { pincode: trimmed };
  }
  return { officename: trimmed };
}

const locationInput = {
  city: z.string().optional().describe("Indian city name, for example 'Delhi' or 'Mumbai'. Defaults to Delhi."),
  latitude: z.number().min(6).max(38).optional().describe("Optional WGS84 latitude in India."),
  longitude: z.number().min(68).max(98).optional().describe("Optional WGS84 longitude in India."),
};

async function resolveIndiaLocation(
  env: Env,
  city?: string,
  latitude?: number,
  longitude?: number,
): Promise<{ latitude: number; longitude: number; label: string }> {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude, label: city ?? `${latitude},${longitude}` };
  }

  const name = (city ?? DEFAULT_CITY).trim();
  const known = CITY_COORDINATES[name.toLowerCase()];
  if (known) {
    return { ...known, label: name };
  }

  const result = await searchMapsAddress(env, `${name}, India`, 1);
  const first = result.results?.[0];
  const lat = Number(first?.lat);
  const lon = Number(first?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Could not geocode city: ${name}`);
  }

  return { latitude: lat, longitude: lon, label: first?.display_name ?? name };
}

export function createMcpServer(env: Env): McpServer {
  const server = new McpServer({
    name: env.MCP_SERVER_NAME,
    version: env.MCP_SERVER_VERSION,
  });

  server.registerTool(
    "in_datasets_search",
    {
      title: "Search India Datasets",
      description: "Search data.gov.in datasets by keyword.",
      inputSchema: {
        query: z.string().default("").describe("Search keyword, for example 'air quality' or 'rainfall'."),
        page: z.number().int().min(1).default(1).describe("Result page number."),
      },
    },
    async ({ query, page }) => {
      const result = await listDatasets(env, query, page);
      return toolResult({
        ...sourceMeta({ api: "lists", query, page }),
        data: result.records ?? [],
        total: result.total ?? result.count,
        error: result.errorMsg,
      });
    },
  );

  server.registerTool(
    "in_dataset_metadata",
    {
      title: "Get India Dataset Metadata",
      description: "Get metadata for a data.gov.in resource by resource ID.",
      inputSchema: {
        dataset_id: z.string().min(2).describe("Resource / dataset ID from data.gov.in."),
      },
    },
    async ({ dataset_id }) => {
      const result = await getDatasetMetadata(env, dataset_id);
      return toolResult({
        ...sourceMeta({ api: "resource metadata", dataset_id }),
        data: result,
      });
    },
  );

  server.registerTool(
    "in_dataset_query",
    {
      title: "Query India Dataset Rows",
      description: "Search or paginate rows in a tabular data.gov.in resource.",
      inputSchema: {
        dataset_id: z.string().min(2).describe("Resource / dataset ID from data.gov.in."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Rows to return, capped at 1000."),
        offset: z.number().int().min(0).optional().describe("Row offset for pagination."),
        filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe("Exact-match filters by column name."),
        q: z.string().optional().describe("Optional extra filter text."),
      },
    },
    async ({ dataset_id, limit, offset, filters, q }) => {
      const result = await queryDataset(env, {
        datasetId: dataset_id,
        limit,
        offset,
        filters,
        q,
      });

      return toolResult({
        ...sourceMeta({ api: "resource query", dataset_id }),
        data: result.result,
        success: result.success,
      });
    },
  );

  server.registerTool(
    "in_weather_2h",
    {
      title: "India 2-Hour Weather Forecast",
      description: "Get the next 2-hour weather forecast for an Indian city.",
      inputSchema: locationInput,
    },
    async ({ city, latitude, longitude }) => {
      const location = await resolveIndiaLocation(env, city, latitude, longitude);
      const result = await getRealtimeApi<Record<string, unknown>>(env, "forecast", {
        latitude: location.latitude,
        longitude: location.longitude,
        forecast_hours: 2,
        hourly: "temperature_2m,precipitation,relative_humidity_2m,weather_code,wind_speed_10m",
        timezone: "Asia/Kolkata",
      });

      return toolResult({
        ...weatherMeta({ api: "forecast hourly", city: location.label }),
        location,
        data: result,
      });
    },
  );

  server.registerTool(
    "in_weather_24h",
    {
      title: "India 24-Hour Weather Forecast",
      description: "Get a 24-hour weather outlook for an Indian city.",
      inputSchema: locationInput,
    },
    async ({ city, latitude, longitude }) => {
      const location = await resolveIndiaLocation(env, city, latitude, longitude);
      const result = await getRealtimeApi<Record<string, unknown>>(env, "forecast", {
        latitude: location.latitude,
        longitude: location.longitude,
        forecast_days: 1,
        hourly: "temperature_2m,precipitation,relative_humidity_2m,weather_code,wind_speed_10m",
        timezone: "Asia/Kolkata",
      });

      return toolResult({
        ...weatherMeta({ api: "forecast 24-hour", city: location.label }),
        location,
        data: result,
      });
    },
  );

  server.registerTool(
    "in_weather_4day",
    {
      title: "India 4-Day Weather Forecast",
      description: "Get a 4-day weather forecast for an Indian city.",
      inputSchema: locationInput,
    },
    async ({ city, latitude, longitude }) => {
      const location = await resolveIndiaLocation(env, city, latitude, longitude);
      const result = await getRealtimeApi<Record<string, unknown>>(env, "forecast", {
        latitude: location.latitude,
        longitude: location.longitude,
        forecast_days: 4,
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max",
        timezone: "Asia/Kolkata",
      });

      return toolResult({
        ...weatherMeta({ api: "forecast 4-day", city: location.label }),
        location,
        data: result,
      });
    },
  );

  server.registerTool(
    "in_uv_index",
    {
      title: "India UV Index",
      description: "Get current UV index for an Indian city.",
      inputSchema: locationInput,
    },
    async ({ city, latitude, longitude }) => {
      const location = await resolveIndiaLocation(env, city, latitude, longitude);
      const result = await getRealtimeApi<Record<string, unknown>>(env, "forecast", {
        latitude: location.latitude,
        longitude: location.longitude,
        current: "uv_index",
        daily: "uv_index_max",
        forecast_days: 1,
        timezone: "Asia/Kolkata",
      });

      return toolResult({
        ...weatherMeta({ api: "forecast UV", city: location.label }),
        location,
        data: result,
      });
    },
  );

  server.registerTool(
    "in_rainfall",
    {
      title: "India Daily District Rainfall",
      description: "Get daily district-wise average rainfall in millimetres from data.gov.in. Falls back to Open-Meteo if the dataset is unavailable.",
      inputSchema: {
        ...locationInput,
        state: z.string().optional().describe("Indian state name, matching the rainfall dataset State field."),
        district: z.string().optional().describe("District name. Defaults to city when omitted."),
        date: z.string().optional().describe("Optional date filter."),
        year: z.union([z.string(), z.number()]).optional().describe("Optional year filter."),
        month: z.union([z.string(), z.number()]).optional().describe("Optional month filter."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum rows to return."),
      },
    },
    async ({ city, state, district, date, year, month, latitude, longitude, limit }) => {
      try {
        const result = await getDistrictRainfall(env, {
          state,
          district: district ?? city,
          date,
          year,
          month,
          limit,
        });

        return toolResult({
          ...rainfallMeta({
            dataset_id: DISTRICT_RAINFALL_RESOURCE_ID,
            unit: "MM",
            granularity: "daily",
            state,
            district: district ?? city,
            date,
            year,
            month,
          }),
          data: result.records,
          total: result.total,
        });
      } catch (error) {
        const location = await resolveIndiaLocation(env, city, latitude, longitude);
        const result = await getRealtimeApi<Record<string, unknown>>(env, "forecast", {
          latitude: location.latitude,
          longitude: location.longitude,
          current: "precipitation",
          hourly: "precipitation,precipitation_probability",
          forecast_hours: 24,
          timezone: "Asia/Kolkata",
        });

        return toolResult({
          ...weatherMeta({ api: "forecast rainfall", city: location.label, fallback_from: "IMD district rainfall" }),
          location,
          fallback: true,
          rainfall_error: error instanceof Error ? error.message : String(error),
          data: result,
        });
      }
    },
  );

  server.registerTool(
    "in_air_temperature",
    {
      title: "India Air Temperature",
      description: "Get live air temperature for an Indian city.",
      inputSchema: locationInput,
    },
    async ({ city, latitude, longitude }) => {
      const location = await resolveIndiaLocation(env, city, latitude, longitude);
      const result = await getRealtimeApi<Record<string, unknown>>(env, "forecast", {
        latitude: location.latitude,
        longitude: location.longitude,
        current: "temperature_2m,apparent_temperature",
        timezone: "Asia/Kolkata",
      });

      return toolResult({
        ...weatherMeta({ api: "forecast temperature", city: location.label }),
        location,
        data: result,
      });
    },
  );

  server.registerTool(
    "in_relative_humidity",
    {
      title: "India Relative Humidity",
      description: "Get live relative humidity for an Indian city.",
      inputSchema: locationInput,
    },
    async ({ city, latitude, longitude }) => {
      const location = await resolveIndiaLocation(env, city, latitude, longitude);
      const result = await getRealtimeApi<Record<string, unknown>>(env, "forecast", {
        latitude: location.latitude,
        longitude: location.longitude,
        current: "relative_humidity_2m",
        timezone: "Asia/Kolkata",
      });

      return toolResult({
        ...weatherMeta({ api: "forecast humidity", city: location.label }),
        location,
        data: result,
      });
    },
  );

  server.registerTool(
    "in_air_quality",
    {
      title: "India Air Quality",
      description: "Get CPCB real-time AQI station rows from data.gov.in. Falls back to Open-Meteo if CPCB is unavailable.",
      inputSchema: {
        ...locationInput,
        state: z.string().optional().describe("Optional Indian state name to filter CPCB stations."),
        station: z.string().optional().describe("Optional CPCB station name filter."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum CPCB rows to return."),
      },
    },
    async ({ city, state, station, latitude, longitude, limit }) => {
      try {
        const result = await getCpcbAirQuality(env, {
          city: city ?? DEFAULT_CITY,
          state,
          station,
          limit,
        });

        return toolResult({
          ...cpcbMeta({ dataset_id: CPCB_AQI_RESOURCE_ID, city: city ?? DEFAULT_CITY, state, station }),
          data: result.records,
          total: result.total,
        });
      } catch (error) {
        const location = await resolveIndiaLocation(env, city, latitude, longitude);
        const openMeteo = await getAirQualityApi<Record<string, unknown>>(env, "air-quality", {
          latitude: location.latitude,
          longitude: location.longitude,
          current: "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi",
          timezone: "Asia/Kolkata",
        });

        return toolResult({
          ...weatherMeta({ api: "air-quality", city: location.label, fallback_from: "CPCB" }),
          location,
          fallback: true,
          cpcb_error: error instanceof Error ? error.message : String(error),
          data: openMeteo,
        });
      }
    },
  );

  server.registerTool(
    "in_address_search",
    {
      title: "India Address Search",
      description: "Search Indian pincodes and post offices from India Post (data.gov.in). Falls back to Nominatim if the pincode directory is unavailable.",
      inputSchema: {
        query: z.string().min(2).describe("6-digit pincode, post office name, or address text."),
        page: z.number().int().min(1).default(1).describe("Result page number for Nominatim fallback."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum India Post rows to return."),
      },
    },
    async ({ query, page, limit }) => {
      try {
        const result = await getPincodeDirectory(env, { ...pincodeLookupOptions(query), limit });
        return toolResult({
          ...pincodeMeta({ query }),
          data: result.records,
          total: result.total,
        });
      } catch (error) {
        const result = await searchMapsAddress(env, query, page);
        return toolResult({
          ...mapsMeta({ api: "search", query, page, fallback_from: "India Post pincode directory" }),
          fallback: true,
          pincode_error: error instanceof Error ? error.message : String(error),
          data: result,
        });
      }
    },
  );

  server.registerTool(
    "in_geocode",
    {
      title: "India Geocode",
      description: "Convert an Indian pincode or post office to latitude/longitude using India Post. Falls back to Nominatim if needed.",
      inputSchema: {
        query: z.string().min(2).describe("6-digit pincode, post office name, or address text."),
        limit: z.number().int().min(1).max(10).default(5).describe("Maximum results to return."),
      },
    },
    async ({ query, limit }) => {
      try {
        const result = await getPincodeDirectory(env, { ...pincodeLookupOptions(query), limit });
        const results = result.records.slice(0, limit).map((item) => ({
          search_value: item.officename ?? item.pincode,
          address: [item.officename, item.district, item.statename, item.pincode].filter(Boolean).join(", "),
          postal_code: item.pincode,
          latitude: item.latitude,
          longitude: item.longitude,
          office_type: item.officetype,
          district: item.district,
          state: item.statename,
        }));

        return toolResult({
          ...pincodeMeta({ query }),
          found: results.length,
          total: result.total,
          results,
        });
      } catch (error) {
        const result = await searchMapsAddress(env, query, 1);
        const results = (result.results ?? []).slice(0, limit).map((item) => ({
          search_value: item.display_name,
          address: item.display_name,
          postal_code: item.postcode,
          latitude: item.lat,
          longitude: item.lon,
        }));

        return toolResult({
          ...mapsMeta({ api: "search", query, fallback_from: "India Post pincode directory" }),
          fallback: true,
          pincode_error: error instanceof Error ? error.message : String(error),
          found: result.found,
          total_pages: result.totalNumPages,
          results,
        });
      }
    },
  );

  server.registerTool(
    "in_reverse_geocode",
    {
      title: "India Reverse Geocode",
      description: "Find nearby Indian addresses for a WGS84 latitude/longitude.",
      inputSchema: {
        latitude: z.number().min(6).max(38).describe("WGS84 latitude in India."),
        longitude: z.number().min(68).max(98).describe("WGS84 longitude in India."),
        buffer: z.number().int().min(1).max(500).default(40).describe("Search radius hint in metres."),
        address_type: z.enum(["All", "Road"]).default("All").describe("Address type filter."),
      },
    },
    async ({ latitude, longitude, buffer, address_type }) => {
      const result = await reverseGeocodeMaps(env, latitude, longitude, buffer, address_type);
      return toolResult({
        ...mapsMeta({ api: "reverse", latitude, longitude, buffer, address_type }),
        data: result,
      });
    },
  );

  server.registerTool(
    "in_bus_stops",
    {
      title: "Bengaluru BMTC Bus Stops",
      description: "List BMTC bus stops from the public static GTFS CSV. No API key required.",
      inputSchema: {
        skip: z.number().int().min(0).default(0).describe("Pagination offset."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum rows to return."),
        query: z.string().optional().describe("Optional stop name / id filter."),
      },
    },
    async ({ skip, limit, query }) => {
      const result = await listBusStops(env, skip, limit, query);
      return toolResult({
        ...transitMeta({ api: result.file, skip, query }),
        count: result.data.length,
        total: result.total,
        data: result,
      });
    },
  );

  server.registerTool(
    "in_bus_services",
    {
      title: "Bengaluru BMTC Bus Services",
      description: "List BMTC bus services from the public static GTFS CSV. No API key required.",
      inputSchema: {
        skip: z.number().int().min(0).default(0).describe("Pagination offset."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum rows to return."),
        service_no: z.string().optional().describe("Optional service / route name filter."),
      },
    },
    async ({ skip, limit, service_no }) => {
      const result = await listBusServices(env, skip, limit, service_no);
      return toolResult({
        ...transitMeta({ api: result.file, skip, service_no }),
        count: result.data.length,
        total: result.total,
        data: result,
      });
    },
  );

  server.registerTool(
    "in_bus_routes",
    {
      title: "Bengaluru BMTC Bus Routes",
      description: "List BMTC route-stop rows from the public static GTFS CSV. No API key required.",
      inputSchema: {
        service_no: z.string().optional().describe("Optional bus service number."),
        skip: z.number().int().min(0).default(0).describe("Pagination offset."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum route rows to return."),
      },
    },
    async ({ service_no, skip, limit }) => {
      const result = await listBusRoutes(env, skip, limit, service_no);
      return toolResult({
        ...transitMeta({ api: result.file, service_no, skip }),
        count: result.data.length,
        total: result.total,
        data: result,
      });
    },
  );

  server.registerTool(
    "in_mandi_prices",
    {
      title: "India Mandi Commodity Prices",
      description: "Get current daily variety-wise market (mandi) prices from data.gov.in. Filter by state, district, market, commodity, variety, or arrival date.",
      inputSchema: {
        state: z.string().optional().describe("Indian state name, for example 'Karnataka'."),
        district: z.string().optional().describe("District name."),
        market: z.string().optional().describe("Mandi / market name."),
        commodity: z.string().optional().describe("Commodity name, for example 'Tomato' or 'Wheat'."),
        variety: z.string().optional().describe("Optional commodity variety."),
        arrival_date: z.string().optional().describe("Optional arrival date filter."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum rows to return."),
      },
    },
    async ({ state, district, market, commodity, variety, arrival_date, limit }) => {
      const result = await getMandiPrices(env, {
        state,
        district,
        market,
        commodity,
        variety,
        arrival_date,
        limit,
      });

      return toolResult({
        ...mandiMeta({
          dataset_id: MANDI_PRICES_RESOURCE_ID,
          granularity: "daily",
          state,
          district,
          market,
          commodity,
          variety,
          arrival_date,
        }),
        data: result.records,
        total: result.total,
      });
    },
  );

  server.registerTool(
    "in_hospital_directory",
    {
      title: "India National Hospital Directory",
      description: "Search the National Hospital Directory (with geo codes) from data.gov.in. Filter by state, district, hospital name, category, pincode, or location.",
      inputSchema: {
        state: z.string().optional().describe("Indian state name, matching the State field."),
        district: z.string().optional().describe("District name."),
        hospital_name: z.string().optional().describe("Exact hospital name as stored in Hospital_Name."),
        hospital_category: z.string().optional().describe("Hospital category, for example public or private."),
        pincode: z.string().optional().describe("6-digit pincode."),
        location: z.string().optional().describe("Location / locality text from the Location field."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum rows to return."),
      },
    },
    async ({ state, district, hospital_name, hospital_category, pincode, location, limit }) => {
      const result = await getHospitalDirectory(env, {
        state,
        district,
        hospital_name,
        hospital_category,
        pincode,
        location,
        limit,
      });

      return toolResult({
        ...hospitalMeta({
          dataset_id: HOSPITAL_DIRECTORY_RESOURCE_ID,
          granularity: "monthly",
          state,
          district,
          hospital_name,
          hospital_category,
          pincode,
          location,
        }),
        data: result.records,
        total: result.total,
      });
    },
  );

  server.registerTool(
    "in_ifsc_lookup",
    {
      title: "India IFSC Lookup",
      description: "Look up an Indian bank branch by 11-character IFSC, or search branches by city/district/query using Razorpay's public IFSC API. No API key required.",
      inputSchema: {
        ifsc: z.string().trim().length(11).optional().describe("11-character IFSC, for example HDFC0000001."),
        city: z.string().optional().describe("City name for branch search, for example NAMAKKAL or CHENNAI."),
        district: z.string().optional().describe("District name for branch search."),
        q: z.string().optional().describe("Free-text search across bank/branch/city."),
        limit: z.number().int().min(1).max(200).default(50).describe("Max search rows to return."),
        offset: z.number().int().min(0).default(0).describe("Search pagination offset."),
      },
    },
    async ({ ifsc, city, district, q, limit, offset }) => {
      if (ifsc?.trim()) {
        const data = await lookupIfsc(env, ifsc);
        return toolResult({
          ...ifscMeta({ mode: "lookup", ifsc: ifsc.trim().toUpperCase() }),
          data,
        });
      }

      const result = await searchIfsc(env, { city, district, q, limit, offset });
      return toolResult({
        ...ifscMeta({ mode: "search", city, district, q, limit, offset }),
        count: result.count,
        hasNext: result.hasNext,
        data: result.data,
      });
    },
  );

  server.registerTool(
    "in_fx_rate",
    {
      title: "INR Exchange Rate",
      description: "Get a currency rate against INR (default USD to INR). Uses Frankfurter, with ExchangeRate-API as fallback. No API key required.",
      inputSchema: {
        base: z.string().default("USD").describe("ISO 4217 base currency, for example USD or EUR."),
        symbols: z.string().default("INR").describe("Comma-separated quote currencies. Defaults to INR."),
      },
    },
    async ({ base, symbols }) => {
      const result = await getFxRates(env, base, symbols);
      return toolResult({
        ...fxMeta({
          source: result.source,
          agency: result.source === "Frankfurter" ? "European Central Bank via Frankfurter" : "ExchangeRate-API open endpoint",
          api: result.source === "Frankfurter" ? "api.frankfurter.dev" : "open.er-api.com",
          base: result.base,
          symbols,
        }),
        date: result.date,
        data: result.rates,
      });
    },
  );

  server.registerTool(
    "in_holidays",
    {
      title: "India Public Holidays",
      description: "List Indian public holidays for a year from Tallyfy's free holiday dataset. Not the official gazetted list. Optional date filter (YYYY-MM-DD).",
      inputSchema: {
        year: z.number().int().min(2015).max(2100).optional().describe("Calendar year. Defaults to the current year in Asia/Kolkata."),
        date: z.string().optional().describe("Optional YYYY-MM-DD filter. When set, year is taken from this date."),
      },
    },
    async ({ year, date }) => {
      const result = await getIndiaHolidays(env, year, date);
      return toolResult({
        ...holidayMeta({ year: result.year, date }),
        count: result.holidays.length,
        data: result.holidays,
      });
    },
  );

  server.registerTool(
    "in_earthquakes",
    {
      title: "India Region Earthquakes",
      description: "Recent earthquakes in the India bounding box from USGS. Not an IMD feed. Filter by minimum magnitude and optional start/end time.",
      inputSchema: {
        minmagnitude: z.number().min(0).max(10).default(4).describe("Minimum magnitude. Defaults to 4."),
        starttime: z.string().optional().describe("Optional start time, for example 2026-01-01 or 2026-01-01T00:00:00."),
        endtime: z.string().optional().describe("Optional end time."),
        limit: z.number().int().min(1).max(1000).default(50).describe("Maximum events to return."),
      },
    },
    async ({ minmagnitude, starttime, endtime, limit }) => {
      const result = await getIndiaEarthquakes(env, { minmagnitude, starttime, endtime, limit });
      return toolResult({
        ...earthquakeMeta({ minmagnitude, starttime, endtime }),
        bounds: result.bounds,
        count: result.count,
        data: result.events,
      });
    },
  );

  server.registerTool(
    "in_cricket_live",
    {
      title: "India Cricket Live Matches",
      description: "Current/live cricket matches from CricAPI (CricketData.org). Requires CRICAPI_API_KEY. Free tier is rate-limited (~100 hits/day); not official BCCI/ICC data.",
      inputSchema: {
        offset: z.number().int().min(0).default(0).describe("Pagination offset. Page size is typically 25."),
      },
    },
    async ({ offset }) => {
      const result = await getCurrentCricketMatches(env, offset);
      return toolResult({
        ...cricketMeta({ endpoint: result.endpoint, offset: result.offset }),
        info: result.info,
        count: result.data.length,
        data: result.data,
      });
    },
  );

  server.registerTool(
    "in_cricket_matches",
    {
      title: "India Cricket Match List",
      description: "Cricket match list/schedule from CricAPI (CricketData.org). Requires CRICAPI_API_KEY. Free tier is rate-limited (~100 hits/day); not official BCCI/ICC data.",
      inputSchema: {
        offset: z.number().int().min(0).default(0).describe("Pagination offset. Page size is typically 25."),
      },
    },
    async ({ offset }) => {
      const result = await getCricketMatches(env, offset);
      return toolResult({
        ...cricketMeta({ endpoint: result.endpoint, offset: result.offset }),
        info: result.info,
        count: result.data.length,
        data: result.data,
      });
    },
  );

  server.registerTool(
    "in_elevation",
    {
      title: "India Elevation (DEM)",
      description: "Ground elevation in metres from Open-Meteo DEM for a point in India. Provide latitude/longitude or a city name.",
      inputSchema: {
        ...locationInput,
      },
    },
    async ({ city, latitude, longitude }) => {
      const location = await resolveIndiaLocation(env, city, latitude, longitude);
      const result = await getRealtimeApi<{ elevation?: number[] }>(env, "elevation", {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      const elevation = result.elevation?.[0];
      if (typeof elevation !== "number") {
        throw new Error("Open-Meteo elevation returned no value for this point.");
      }
      return toolResult({
        ...weatherMeta({
          agency: "Open-Meteo DEM",
          city: location.label,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
        elevation_m: elevation,
      });
    },
  );

  server.registerTool(
    "in_postal_code",
    {
      title: "India Postal Code Directory",
      description: "Look up India Post office records by 6-digit pincode and/or office/district/state filters (same underlying resource as address search).",
      inputSchema: {
        pincode: z.string().optional().describe("6-digit pincode."),
        officename: z.string().optional().describe("Post office name."),
        district: z.string().optional().describe("District name."),
        statename: z.string().optional().describe("State name."),
        limit: z.number().int().min(1).max(1000).default(100).describe("Maximum rows to return."),
      },
    },
    async ({ pincode, officename, district, statename, limit }) => {
      const result = await getPincodeDirectory(env, { pincode, officename, district, statename, limit });
      return toolResult({
        ...pincodeMeta({
          catalog_id: PINCODE_CATALOG_ID,
          dataset_id: PINCODE_RESOURCE_ID,
          pincode,
          officename,
          district,
          statename,
        }),
        data: result.records,
        total: result.total,
      });
    },
  );

  registerResourceTools(server, env);

  return server;
}
