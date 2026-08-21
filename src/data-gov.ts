import type { Env } from "./env";
import { fetchJson } from "./http";

const DATA_GOV_LISTS_URL = "https://api.data.gov.in/lists";
const DATA_GOV_RESOURCE_URL = "https://api.data.gov.in/resource";
const DATA_GOV_REALTIME_URL = "https://api.open-meteo.com/v1";
const DATA_GOV_AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1";
export const CPCB_AQI_RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";
export const DISTRICT_RAINFALL_RESOURCE_ID = "6c05cd1b-ed59-40c2-bc31-e314f39c6971";
export const PINCODE_CATALOG_ID = "709e9d78-bf11-487d-93fd-d547d24cc0ef";
export const PINCODE_RESOURCE_ID = "5c2f62fe-5afa-4119-a499-fec9d604d5bd";
export const MANDI_PRICES_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
export const HOSPITAL_DIRECTORY_RESOURCE_ID = "98fa254e-c5f8-4910-a19b-4828939b477d";

export interface DataGovDatasetListResponse {
  records?: Array<Record<string, unknown>>;
  count?: number;
  total?: number;
  limit?: number;
  offset?: number;
  errorMsg?: string;
}

export interface DataStoreSearchResponse {
  success: boolean;
  result?: {
    resource_id: string;
    fields?: Array<{ id: string; type: string }>;
    records?: Array<Record<string, unknown>>;
    limit?: number;
    offset?: number;
    total?: number;
    _links?: Record<string, string>;
  };
  error?: {
    message?: string;
  };
}

export interface QueryDatasetOptions {
  datasetId: string;
  limit?: number;
  offset?: number;
  fields?: string[];
  filters?: Record<string, string | number | boolean>;
  q?: string;
  sort?: string;
  timeoutMs?: number;
}

export interface QueryAllDatasetOptions extends Omit<QueryDatasetOptions, "offset" | "limit"> {
  pageSize?: number;
  maxRecords?: number;
}

function requireDataGovApiKey(env: Env, purpose = "data.gov.in"): string {
  const key = env.DATA_GOV_IN_API_KEY?.trim();
  if (!key) {
    throw new Error(`${purpose} requires DATA_GOV_IN_API_KEY.`);
  }
  return key;
}

function applyApiKey(url: URL, env: Env, purpose?: string): void {
  url.searchParams.set("api-key", requireDataGovApiKey(env, purpose));
}

export async function queryDataGovResource(
  env: Env,
  resourceId: string,
  options: {
    purpose: string;
    limit?: number;
    offset?: number;
    filters?: Record<string, string | number | undefined>;
  },
): Promise<{ records: Array<Record<string, unknown>>; total?: number }> {
  const url = new URL(`${DATA_GOV_RESOURCE_URL}/${resourceId}`);
  applyApiKey(url, env, options.purpose);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(options.limit ?? 100, 1000)));
  if (options.offset !== undefined) {
    url.searchParams.set("offset", String(options.offset));
  }
  for (const [key, value] of Object.entries(options.filters ?? {})) {
    if (value !== undefined && String(value).trim()) {
      url.searchParams.set(`filters[${key}]`, String(value).trim());
    }
  }

  const raw = await fetchJson<{
    records?: Array<Record<string, unknown>>;
    total?: number;
    count?: number;
  }>(url.toString(), env);

  const records = raw.records ?? [];
  if (records.length === 0) {
    throw new Error(`${options.purpose} returned no records. Check filters or try again later.`);
  }

  return {
    records,
    total: raw.total ?? raw.count,
  };
}

export async function listDatasets(env: Env, query: string, page = 1): Promise<DataGovDatasetListResponse> {
  const limit = 10;
  const url = new URL(DATA_GOV_LISTS_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("filters[active]", "1");
  url.searchParams.set("notfilters[source]", "visualize.data.gov.in");
  url.searchParams.set("offset", String(Math.max(page - 1, 0) * limit));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort[updated]", "desc");
  if (query.trim()) {
    url.searchParams.set("filters[title]", query.trim());
  }
  applyApiKey(url, env);

  return fetchJson<DataGovDatasetListResponse>(url.toString(), env);
}

export async function getDatasetMetadata(env: Env, datasetId: string): Promise<Record<string, unknown>> {
  const url = new URL(`${DATA_GOV_RESOURCE_URL}/${datasetId}`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "0");
  applyApiKey(url, env);

  return fetchJson<Record<string, unknown>>(url.toString(), env);
}

export async function queryDataset(env: Env, options: QueryDatasetOptions): Promise<DataStoreSearchResponse> {
  const url = new URL(`${DATA_GOV_RESOURCE_URL}/${options.datasetId}`);
  const limit = Math.min(options.limit ?? 100, 1000);
  const offset = options.offset ?? 0;
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  if (options.filters && Object.keys(options.filters).length > 0) {
    for (const [key, value] of Object.entries(options.filters)) {
      url.searchParams.set(`filters[${key}]`, String(value));
    }
  }
  if (options.q) {
    url.searchParams.set("filters[title]", options.q);
  }
  applyApiKey(url, env);

  const raw = await fetchJson<{
    records?: Array<Record<string, unknown>>;
    fields?: Array<{ id?: string; name?: string; type?: string }>;
    count?: number;
    total?: number;
    message?: string;
  }>(url.toString(), env, {}, options.timeoutMs);

  return {
    success: true,
    result: {
      resource_id: options.datasetId,
      fields: (raw.fields ?? []).map((field) => ({
        id: String(field.id ?? field.name ?? ""),
        type: String(field.type ?? "string"),
      })),
      records: raw.records ?? [],
      limit,
      offset,
      total: raw.total ?? raw.count,
    },
    error: raw.message ? { message: raw.message } : undefined,
  };
}

export async function queryAllDataset(env: Env, options: QueryAllDatasetOptions): Promise<Array<Record<string, unknown>>> {
  const pageSize = Math.min(options.pageSize ?? 1000, 1000);
  const maxRecords = Math.min(options.maxRecords ?? 5000, 10000);
  const records: Array<Record<string, unknown>> = [];

  for (let offset = 0; records.length < maxRecords; offset += pageSize) {
    const result = await queryDataset(env, {
      ...options,
      limit: Math.min(pageSize, maxRecords - records.length),
      offset,
    });
    const page = result.result?.records ?? [];
    records.push(...page);

    if (page.length < pageSize) {
      break;
    }
  }

  return records;
}

export async function getDatasetDownloadUrl(env: Env, datasetId: string): Promise<string> {
  const url = new URL(`${DATA_GOV_RESOURCE_URL}/${datasetId}`);
  url.searchParams.set("format", "csv");
  applyApiKey(url, env);
  return url.toString();
}

export async function getRealtimeApi<T>(env: Env, path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`${DATA_GOV_REALTIME_URL}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return fetchJson<T>(url.toString(), env);
}

export async function getAirQualityApi<T>(env: Env, path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`${DATA_GOV_AIR_QUALITY_URL}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return fetchJson<T>(url.toString(), env);
}

export interface CpcbAirQualityOptions {
  city?: string;
  state?: string;
  station?: string;
  limit?: number;
  offset?: number;
}

export interface CpcbAirQualityResponse {
  resource_id: string;
  total?: number;
  records: Array<Record<string, unknown>>;
}

export async function getCpcbAirQuality(env: Env, options: CpcbAirQualityOptions = {}): Promise<CpcbAirQualityResponse> {
  const result = await queryDataGovResource(env, CPCB_AQI_RESOURCE_ID, {
    purpose: "CPCB air quality",
    limit: options.limit,
    offset: options.offset,
    filters: {
      city: options.city,
      state: options.state,
      station: options.station,
    },
  });

  return {
    resource_id: CPCB_AQI_RESOURCE_ID,
    total: result.total,
    records: result.records,
  };
}

export interface DistrictRainfallOptions {
  state?: string;
  district?: string;
  date?: string;
  year?: string | number;
  month?: string | number;
  limit?: number;
  offset?: number;
}

export interface DistrictRainfallResponse {
  resource_id: string;
  unit: "MM";
  granularity: "daily";
  total?: number;
  records: Array<Record<string, unknown>>;
}

export async function getDistrictRainfall(env: Env, options: DistrictRainfallOptions = {}): Promise<DistrictRainfallResponse> {
  const result = await queryDataGovResource(env, DISTRICT_RAINFALL_RESOURCE_ID, {
    purpose: "District rainfall",
    limit: options.limit,
    offset: options.offset,
    filters: {
      State: options.state,
      District: options.district,
      Date: options.date,
      Year: options.year,
      Month: options.month,
    },
  });

  return {
    resource_id: DISTRICT_RAINFALL_RESOURCE_ID,
    unit: "MM",
    granularity: "daily",
    total: result.total,
    records: result.records,
  };
}

export interface PincodeDirectoryOptions {
  pincode?: string;
  officename?: string;
  district?: string;
  statename?: string;
  limit?: number;
  offset?: number;
}

export interface PincodeDirectoryResponse {
  catalog_id: string;
  resource_id: string;
  total?: number;
  records: Array<Record<string, unknown>>;
}

export async function getPincodeDirectory(env: Env, options: PincodeDirectoryOptions = {}): Promise<PincodeDirectoryResponse> {
  const result = await queryDataGovResource(env, PINCODE_RESOURCE_ID, {
    purpose: "India Post pincode directory",
    limit: options.limit,
    offset: options.offset,
    filters: {
      pincode: options.pincode,
      officename: options.officename,
      district: options.district,
      statename: options.statename,
    },
  });

  return {
    catalog_id: PINCODE_CATALOG_ID,
    resource_id: PINCODE_RESOURCE_ID,
    total: result.total,
    records: result.records,
  };
}

export interface MandiPriceOptions {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  arrival_date?: string;
  limit?: number;
  offset?: number;
}

export interface MandiPriceResponse {
  resource_id: string;
  granularity: "daily";
  total?: number;
  records: Array<Record<string, unknown>>;
}

export async function getMandiPrices(env: Env, options: MandiPriceOptions = {}): Promise<MandiPriceResponse> {
  const result = await queryDataGovResource(env, MANDI_PRICES_RESOURCE_ID, {
    purpose: "Mandi prices",
    limit: options.limit,
    offset: options.offset,
    filters: {
      state: options.state,
      district: options.district,
      market: options.market,
      commodity: options.commodity,
      variety: options.variety,
      arrival_date: options.arrival_date,
    },
  });

  return {
    resource_id: MANDI_PRICES_RESOURCE_ID,
    granularity: "daily",
    total: result.total,
    records: result.records,
  };
}

export interface HospitalDirectoryOptions {
  state?: string;
  district?: string;
  hospital_name?: string;
  hospital_category?: string;
  pincode?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

export interface HospitalDirectoryResponse {
  resource_id: string;
  granularity: "monthly";
  total?: number;
  records: Array<Record<string, unknown>>;
}

export async function getHospitalDirectory(env: Env, options: HospitalDirectoryOptions = {}): Promise<HospitalDirectoryResponse> {
  const result = await queryDataGovResource(env, HOSPITAL_DIRECTORY_RESOURCE_ID, {
    purpose: "Hospital directory",
    limit: options.limit,
    offset: options.offset,
    filters: {
      state: options.state,
      district: options.district,
      hospital_name: options.hospital_name,
      hospital_category: options.hospital_category,
      _pincode: options.pincode,
      _location: options.location,
    },
  });

  return {
    resource_id: HOSPITAL_DIRECTORY_RESOURCE_ID,
    granularity: "monthly",
    total: result.total,
    records: result.records,
  };
}
