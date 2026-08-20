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

function applyApiKey(url: URL, env: Env): void {
  if (env.DATA_GOV_IN_API_KEY) {
    url.searchParams.set("api-key", env.DATA_GOV_IN_API_KEY);
  }
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
  if (!env.DATA_GOV_IN_API_KEY) {
    throw new Error("CPCB air quality requires DATA_GOV_IN_API_KEY.");
  }

  const url = new URL(`${DATA_GOV_RESOURCE_URL}/${CPCB_AQI_RESOURCE_ID}`);
  url.searchParams.set("api-key", env.DATA_GOV_IN_API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(options.limit ?? 100, 1000)));
  if (options.offset !== undefined) {
    url.searchParams.set("offset", String(options.offset));
  }
  if (options.city?.trim()) {
    url.searchParams.set("filters[city]", options.city.trim());
  }
  if (options.state?.trim()) {
    url.searchParams.set("filters[state]", options.state.trim());
  }
  if (options.station?.trim()) {
    url.searchParams.set("filters[station]", options.station.trim());
  }

  const raw = await fetchJson<{
    records?: Array<Record<string, unknown>>;
    total?: number;
    count?: number;
  }>(url.toString(), env);

  const records = raw.records ?? [];
  if (records.length === 0) {
    throw new Error("CPCB air quality returned no records. Check city/state filters or try again later.");
  }

  return {
    resource_id: CPCB_AQI_RESOURCE_ID,
    total: raw.total ?? raw.count,
    records,
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
  if (!env.DATA_GOV_IN_API_KEY) {
    throw new Error("District rainfall requires DATA_GOV_IN_API_KEY.");
  }

  const url = new URL(`${DATA_GOV_RESOURCE_URL}/${DISTRICT_RAINFALL_RESOURCE_ID}`);
  url.searchParams.set("api-key", env.DATA_GOV_IN_API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(options.limit ?? 100, 1000)));
  if (options.offset !== undefined) {
    url.searchParams.set("offset", String(options.offset));
  }
  if (options.state?.trim()) {
    url.searchParams.set("filters[State]", options.state.trim());
  }
  if (options.district?.trim()) {
    url.searchParams.set("filters[District]", options.district.trim());
  }
  if (options.date?.trim()) {
    url.searchParams.set("filters[Date]", options.date.trim());
  }
  if (options.year !== undefined && String(options.year).trim()) {
    url.searchParams.set("filters[Year]", String(options.year).trim());
  }
  if (options.month !== undefined && String(options.month).trim()) {
    url.searchParams.set("filters[Month]", String(options.month).trim());
  }

  const raw = await fetchJson<{
    records?: Array<Record<string, unknown>>;
    total?: number;
    count?: number;
  }>(url.toString(), env);

  const records = raw.records ?? [];
  if (records.length === 0) {
    throw new Error("District rainfall returned no records. Check State/District/Date filters or try again later.");
  }

  return {
    resource_id: DISTRICT_RAINFALL_RESOURCE_ID,
    unit: "MM",
    granularity: "daily",
    total: raw.total ?? raw.count,
    records,
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
  if (!env.DATA_GOV_IN_API_KEY) {
    throw new Error("India Post pincode directory requires DATA_GOV_IN_API_KEY.");
  }

  const url = new URL(`${DATA_GOV_RESOURCE_URL}/${PINCODE_RESOURCE_ID}`);
  url.searchParams.set("api-key", env.DATA_GOV_IN_API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(options.limit ?? 100, 1000)));
  if (options.offset !== undefined) {
    url.searchParams.set("offset", String(options.offset));
  }
  if (options.pincode?.trim()) {
    url.searchParams.set("filters[pincode]", options.pincode.trim());
  }
  if (options.officename?.trim()) {
    url.searchParams.set("filters[officename]", options.officename.trim());
  }
  if (options.district?.trim()) {
    url.searchParams.set("filters[district]", options.district.trim());
  }
  if (options.statename?.trim()) {
    url.searchParams.set("filters[statename]", options.statename.trim());
  }

  const raw = await fetchJson<{
    records?: Array<Record<string, unknown>>;
    total?: number;
    count?: number;
  }>(url.toString(), env);

  const records = raw.records ?? [];
  if (records.length === 0) {
    throw new Error("India Post pincode directory returned no records. Check pincode/office/district filters or try again later.");
  }

  return {
    catalog_id: PINCODE_CATALOG_ID,
    resource_id: PINCODE_RESOURCE_ID,
    total: raw.total ?? raw.count,
    records,
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
  if (!env.DATA_GOV_IN_API_KEY) {
    throw new Error("Mandi prices require DATA_GOV_IN_API_KEY.");
  }

  const url = new URL(`${DATA_GOV_RESOURCE_URL}/${MANDI_PRICES_RESOURCE_ID}`);
  url.searchParams.set("api-key", env.DATA_GOV_IN_API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(options.limit ?? 100, 1000)));
  if (options.offset !== undefined) {
    url.searchParams.set("offset", String(options.offset));
  }
  if (options.state?.trim()) {
    url.searchParams.set("filters[state]", options.state.trim());
  }
  if (options.district?.trim()) {
    url.searchParams.set("filters[district]", options.district.trim());
  }
  if (options.market?.trim()) {
    url.searchParams.set("filters[market]", options.market.trim());
  }
  if (options.commodity?.trim()) {
    url.searchParams.set("filters[commodity]", options.commodity.trim());
  }
  if (options.variety?.trim()) {
    url.searchParams.set("filters[variety]", options.variety.trim());
  }
  if (options.arrival_date?.trim()) {
    url.searchParams.set("filters[arrival_date]", options.arrival_date.trim());
  }

  const raw = await fetchJson<{
    records?: Array<Record<string, unknown>>;
    total?: number;
    count?: number;
  }>(url.toString(), env);

  const records = raw.records ?? [];
  if (records.length === 0) {
    throw new Error("Mandi prices returned no records. Check state/district/market/commodity filters or try again later.");
  }

  return {
    resource_id: MANDI_PRICES_RESOURCE_ID,
    granularity: "daily",
    total: raw.total ?? raw.count,
    records,
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
  if (!env.DATA_GOV_IN_API_KEY) {
    throw new Error("Hospital directory requires DATA_GOV_IN_API_KEY.");
  }

  const url = new URL(`${DATA_GOV_RESOURCE_URL}/${HOSPITAL_DIRECTORY_RESOURCE_ID}`);
  url.searchParams.set("api-key", env.DATA_GOV_IN_API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(options.limit ?? 100, 1000)));
  if (options.offset !== undefined) {
    url.searchParams.set("offset", String(options.offset));
  }
  if (options.state?.trim()) {
    url.searchParams.set("filters[State]", options.state.trim());
  }
  if (options.district?.trim()) {
    url.searchParams.set("filters[District]", options.district.trim());
  }
  if (options.hospital_name?.trim()) {
    url.searchParams.set("filters[Hospital_Name]", options.hospital_name.trim());
  }
  if (options.hospital_category?.trim()) {
    url.searchParams.set("filters[Hospital_Category]", options.hospital_category.trim());
  }
  if (options.pincode?.trim()) {
    url.searchParams.set("filters[Pincode]", options.pincode.trim());
  }
  if (options.location?.trim()) {
    url.searchParams.set("filters[Location]", options.location.trim());
  }

  const raw = await fetchJson<{
    records?: Array<Record<string, unknown>>;
    total?: number;
    count?: number;
  }>(url.toString(), env);

  const records = raw.records ?? [];
  if (records.length === 0) {
    throw new Error("Hospital directory returned no records. Check state/district/name/pincode filters or try again later.");
  }

  return {
    resource_id: HOSPITAL_DIRECTORY_RESOURCE_ID,
    granularity: "monthly",
    total: raw.total ?? raw.count,
    records,
  };
}
