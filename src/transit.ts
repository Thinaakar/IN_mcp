import type { Env } from "./env";
import { fetchText } from "./http";

const BMTC_STOPS_CSV_URL = "https://raw.githubusercontent.com/Vonter/bmtc-gtfs/main/csv/stops.csv";
const BMTC_ROUTES_CSV_URL = "https://raw.githubusercontent.com/Vonter/bmtc-gtfs/main/csv/routes.csv";

export interface GtfsPage {
  agency: "bmtc";
  file: string;
  total: number;
  skip: number;
  limit: number;
  data: Array<Record<string, unknown>>;
}

export function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  const header = rows.shift();
  if (!header) {
    return [];
  }

  return rows.map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key.trim()] = cells[index] ?? "";
    });
    return record;
  });
}

export function parsePythonList(value: string): string[] {
  const matches = value.match(/'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"/g);
  return (matches ?? []).map((item) => item.slice(1, -1));
}

function paginate<T>(rows: T[], skip: number, limit: number): { total: number; data: T[] } {
  return {
    total: rows.length,
    data: rows.slice(skip, skip + limit),
  };
}

function matchesQuery(record: Record<string, string>, query?: string): boolean {
  if (!query?.trim()) {
    return true;
  }

  const needle = query.trim().toLowerCase();
  return Object.values(record).some((value) => value.toLowerCase().includes(needle));
}

function slimBmtcStop(row: Record<string, string>): Record<string, unknown> {
  return {
    stop_id: row.id,
    stop_name: row.name,
    trip_count: Number(row.trip_count || 0),
    route_count: Number(row.route_count || 0),
    routes: parsePythonList(row.route_list ?? "").slice(0, 20),
  };
}

function slimBmtcRoute(row: Record<string, string>): Record<string, unknown> {
  return {
    route_id: row.id,
    service_no: row.name,
    name: row.full_name,
    direction_id: row.direction_id,
    stop_count: Number(row.stop_count || 0),
    trip_count: Number(row.trip_count || 0),
    stops: parsePythonList(row.stop_list ?? ""),
    first_trips: parsePythonList(row.trip_list ?? "").slice(0, 8),
  };
}

export async function listBusStops(env: Env, skip = 0, limit = 100, query?: string): Promise<GtfsPage> {
  const rows = parseCsv(await fetchText(BMTC_STOPS_CSV_URL, env)).filter((row) => matchesQuery(row, query));
  const page = paginate(rows, skip, limit);
  return {
    agency: "bmtc",
    file: "stops.csv",
    total: page.total,
    skip,
    limit,
    data: page.data.map(slimBmtcStop),
  };
}

export async function listBusServices(env: Env, skip = 0, limit = 100, serviceNo?: string): Promise<GtfsPage> {
  const rows = parseCsv(await fetchText(BMTC_ROUTES_CSV_URL, env)).filter((row) => matchesQuery(row, serviceNo));
  const page = paginate(rows, skip, limit);
  return {
    agency: "bmtc",
    file: "routes.csv",
    total: page.total,
    skip,
    limit,
    data: page.data.map((row) => ({
      route_id: row.id,
      service_no: row.name,
      name: row.full_name,
      direction_id: row.direction_id,
      stop_count: row.stop_count,
      trip_count: row.trip_count,
    })),
  };
}

export async function listBusRoutes(env: Env, skip = 0, limit = 100, serviceNo?: string): Promise<GtfsPage> {
  const rows = parseCsv(await fetchText(BMTC_ROUTES_CSV_URL, env)).filter((row) => matchesQuery(row, serviceNo));
  const page = paginate(rows, skip, limit);
  return {
    agency: "bmtc",
    file: "routes.csv",
    total: page.total,
    skip,
    limit,
    data: page.data.map(slimBmtcRoute),
  };
}
