import type { Env } from "./env";
import { fetchJson } from "./http";

const CRICAPI_BASE_URL = "https://api.cricapi.com/v1";

export interface CricketMatchScore {
  team?: string;
  inning?: string;
  r?: number;
  w?: number;
  o?: number;
}

export interface CricketMatch {
  id?: string;
  name?: string;
  matchType?: string;
  status?: string;
  venue?: string;
  date?: string;
  dateTimeGMT?: string;
  teams?: string[];
  series_id?: string;
  fantasyEnabled?: boolean;
  score?: CricketMatchScore[];
  [key: string]: unknown;
}

export interface CricketApiInfo {
  hitsToday?: number;
  hitsLimit?: number;
  credits?: number;
  offsetRows?: number;
  totalRows?: number;
  queryTime?: number;
}

export interface CricketMatchListResult {
  endpoint: "currentMatches" | "matches";
  offset: number;
  info?: CricketApiInfo;
  data: CricketMatch[];
}

interface CricApiListResponse {
  status?: string;
  reason?: string;
  data?: CricketMatch[];
  info?: CricketApiInfo;
}

function requireCricApiKey(env: Env): string {
  const key = env.CRICAPI_API_KEY?.trim();
  if (!key) {
    throw new Error("CricAPI tools require CRICAPI_API_KEY (signup at https://cricketdata.org/).");
  }
  return key;
}

function slimMatch(match: CricketMatch): CricketMatch {
  return {
    id: match.id,
    name: match.name,
    matchType: match.matchType,
    status: match.status,
    venue: match.venue,
    date: match.date,
    dateTimeGMT: match.dateTimeGMT,
    teams: match.teams,
    series_id: match.series_id,
    fantasyEnabled: match.fantasyEnabled,
    score: match.score,
  };
}

async function cricApiGet(
  env: Env,
  path: "currentMatches" | "matches",
  offset = 0,
): Promise<CricketMatchListResult> {
  const url = new URL(`${CRICAPI_BASE_URL}/${path}`);
  url.searchParams.set("apikey", requireCricApiKey(env));
  url.searchParams.set("offset", String(Math.max(offset, 0)));

  const payload = await fetchJson<CricApiListResponse>(url.toString(), env, {}, 20000);
  if (payload.status === "failure") {
    throw new Error(payload.reason?.trim() || "CricAPI request failed.");
  }

  const data = Array.isArray(payload.data) ? payload.data.map(slimMatch) : [];
  return {
    endpoint: path,
    offset,
    info: payload.info,
    data,
  };
}

export async function getCurrentCricketMatches(env: Env, offset = 0): Promise<CricketMatchListResult> {
  return cricApiGet(env, "currentMatches", offset);
}

export async function getCricketMatches(env: Env, offset = 0): Promise<CricketMatchListResult> {
  return cricApiGet(env, "matches", offset);
}
