import type { Env } from "./env";
import { fetchJson } from "./http";

const IFSC_URL = "https://ifsc.razorpay.com";
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export interface IfscRecord {
  bank?: string;
  ifsc?: string;
  branch?: string;
  centre?: string;
  district?: string;
  state?: string;
  address?: string;
  contact?: string;
  city?: string;
  iso3166?: string;
  micr?: string;
  imps?: boolean;
  neft?: boolean;
  rtgs?: boolean;
  upi?: boolean;
  [key: string]: unknown;
}

export function normalizeIfsc(ifsc: string): string {
  const normalized = ifsc.trim().toUpperCase();
  if (!IFSC_PATTERN.test(normalized)) {
    throw new Error("IFSC must be 11 characters, for example HDFC0000001.");
  }
  return normalized;
}

export async function lookupIfsc(env: Env, ifsc: string): Promise<IfscRecord> {
  const code = normalizeIfsc(ifsc);
  try {
    // Razorpay IFSC is often slower than other keyless APIs; allow up to 20s.
    return await fetchJson<IfscRecord>(`${IFSC_URL}/${code}`, env, {}, 20000);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("404")) {
      throw new Error(`Unknown IFSC: ${code}`);
    }
    throw error;
  }
}
