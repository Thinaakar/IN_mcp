import type { Env } from "./env";
import { fetchJson } from "./http";

const TALLYFY_URL = "https://tallyfy.com/national-holidays/api/IN";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface PublicHoliday {
  date: string;
  localName?: string;
  name?: string;
  countryCode?: string;
  type?: string;
  observedDate?: string;
  description?: string;
  [key: string]: unknown;
}

interface TallyfyHoliday {
  date?: string;
  name?: string;
  local_name?: string;
  type?: string;
  observed_date?: string;
  description?: string;
}

interface TallyfyResponse {
  country?: { code?: string; name?: string };
  year?: number;
  holidays?: TallyfyHoliday[];
}

export function currentIndiaYear(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric" }).format(now));
}

export function holidayYearFromInput(year?: number, date?: string): number {
  if (date) {
    if (!DATE_PATTERN.test(date)) {
      throw new Error("date must be YYYY-MM-DD.");
    }
    return Number(date.slice(0, 4));
  }
  if (typeof year === "number") {
    return year;
  }
  return currentIndiaYear();
}

export function filterHolidays(records: PublicHoliday[], date?: string): PublicHoliday[] {
  if (!date) {
    return records;
  }
  if (!DATE_PATTERN.test(date)) {
    throw new Error("date must be YYYY-MM-DD.");
  }
  return records.filter((item) => item.date === date || item.observedDate === date);
}

export function normalizeTallyfyHolidays(payload: TallyfyResponse): PublicHoliday[] {
  return (payload.holidays ?? []).map((item) => ({
    date: item.date ?? "",
    localName: item.local_name,
    name: item.name,
    countryCode: payload.country?.code ?? "IN",
    type: item.type,
    observedDate: item.observed_date,
    description: item.description,
  }));
}

export async function getIndiaHolidays(
  env: Env,
  year?: number,
  date?: string,
): Promise<{ year: number; holidays: PublicHoliday[] }> {
  const resolvedYear = holidayYearFromInput(year, date);
  const payload = await fetchJson<TallyfyResponse>(`${TALLYFY_URL}/${resolvedYear}.json`, env);
  return {
    year: payload.year ?? resolvedYear,
    holidays: filterHolidays(normalizeTallyfyHolidays(payload), date),
  };
}
