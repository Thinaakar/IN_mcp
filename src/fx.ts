import type { Env } from "./env";
import { fetchJson } from "./http";

const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest";
const OPEN_ER_API_URL = "https://open.er-api.com/v6/latest";
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export interface FxRateResponse {
  source: "Frankfurter" | "ExchangeRate-API";
  base: string;
  date?: string;
  rates: Record<string, number>;
}

export function normalizeCurrency(code: string, label: string): string {
  const normalized = code.trim().toUpperCase();
  if (!CURRENCY_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a 3-letter ISO currency code, for example USD or INR.`);
  }
  return normalized;
}

function parseSymbols(symbols: string): string[] {
  const codes = symbols
    .split(",")
    .map((item) => normalizeCurrency(item, "Currency symbol"))
    .filter((item, index, list) => list.indexOf(item) === index);
  if (codes.length === 0) {
    throw new Error("Provide at least one currency symbol, for example INR.");
  }
  return codes;
}

export async function getFxRates(env: Env, base = "USD", symbols = "INR"): Promise<FxRateResponse> {
  const from = normalizeCurrency(base, "Base currency");
  const to = parseSymbols(symbols);

  try {
    const url = new URL(FRANKFURTER_URL);
    url.searchParams.set("base", from);
    url.searchParams.set("symbols", to.join(","));
    const result = await fetchJson<{ base?: string; date?: string; rates?: Record<string, number> }>(url.toString(), env);
    return {
      source: "Frankfurter",
      base: result.base ?? from,
      date: result.date,
      rates: result.rates ?? {},
    };
  } catch (error) {
    const url = new URL(`${OPEN_ER_API_URL}/${from}`);
    const result = await fetchJson<{
      result?: string;
      base_code?: string;
      time_last_update_utc?: string;
      rates?: Record<string, number>;
    }>(url.toString(), env);
    if (result.result && result.result !== "success") {
      throw error instanceof Error ? error : new Error(String(error));
    }
    const rates: Record<string, number> = {};
    for (const code of to) {
      const value = result.rates?.[code];
      if (typeof value === "number") {
        rates[code] = value;
      }
    }
    return {
      source: "ExchangeRate-API",
      base: result.base_code ?? from,
      date: result.time_last_update_utc,
      rates,
    };
  }
}
