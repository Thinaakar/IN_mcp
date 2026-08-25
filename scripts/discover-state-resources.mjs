#!/usr/bin/env node
/**
 * Discover verified data.gov.in resource IDs for state domain tools.
 * Writes scripts/state-resource-candidates.json (no API key).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = readFileSync(join(ROOT, ".dev.vars"), "utf8")
  .split(/\r?\n/)
  .find((line) => line.startsWith("DATA_GOV_IN_API_KEY="))
  ?.slice("DATA_GOV_IN_API_KEY=".length)
  ?.trim();
if (!KEY) {
  throw new Error("DATA_GOV_IN_API_KEY missing in .dev.vars");
}

const EXISTING = new Set([
  "0ce90a70-a714-4e77-817e-b6ac1cc9c286",
  "a9a473d6-691b-4a25-a995-23098f2a7abf",
  "8c06e8f1-3bb1-4299-b032-49ef2527d6a8",
  "0c484052-8c1b-4ff9-a3fc-4fadc73b79ab",
  "f2d31cb3-4b5e-401a-9593-2004b524b542",
  "750dfd29-b629-4220-bbf3-8e2ed4882058",
  "36cc5e04-d47a-4ee6-9fd6-a6b0bcd05c15",
  "02327d37-dbaa-4cf9-a908-a7eecc428d25",
  "e336a512-2dfe-4e4b-8d00-bc1b11e41964",
  "4dc5b88c-f356-49d5-86e7-d8c4eb7c2a27",
  "d7d15ec2-7853-4932-b854-d65ed7abaf65",
  "dec710f2-7ee6-45cd-916f-da58f108fb2a",
  "84d26d02-935b-479c-9427-c27ee1afd76f",
  "dc39ada1-aa0f-4885-8490-21d242cfacc3",
]);

const PORTALS = [
  { code: "ap", name: "Andhra Pradesh", q: ["Meebhoomi", "APTRANSCO", "Meeseva"] },
  { code: "ar", name: "Arunachal Pradesh", q: ["hydro", "tribal", "BADP"] },
  { code: "as", name: "Assam", q: ["flood", "ASDMA", "tea"] },
  { code: "br", name: "Bihar", q: ["Biharbhumi", "RTPS", "land"] },
  { code: "ct", name: "Chhattisgarh", q: ["paddy", "mining", "forest"] },
  { code: "ga", name: "Goa", q: ["tourism", "port", "water"] },
  { code: "gj", name: "Gujarat", q: ["GIDC", "GSECL", "AnyROR"] },
  { code: "hr", name: "Haryana", q: ["Saral", "PPP", "Parivar"] },
  { code: "hp", name: "Himachal Pradesh", q: ["horticulture", "HPSEB", "hydropower"] },
  { code: "jh", name: "Jharkhand", q: ["mineral", "Jharbhoomi", "forest"] },
  { code: "ka", name: "Karnataka", q: ["Bhoomi", "KSRTC", "BBMP"] },
  { code: "kl", name: "Kerala", q: ["LSGD", "health", "IT Mission"] },
  { code: "mp", name: "Madhya Pradesh", q: ["mandi", "e-District", "MPBSE"] },
  { code: "mh", name: "Maharashtra", q: ["tribal", "MahaDBT", "BMC"] },
  { code: "mn", name: "Manipur", q: ["agriculture", "hill", "e-District"] },
  { code: "ml", name: "Meghalaya", q: ["mining", "rainfall", "e-Prastuti"] },
  { code: "mz", name: "Mizoram", q: ["forest", "PHE", "water"] },
  { code: "nl", name: "Nagaland", q: ["handloom", "VDB", "village"] },
  { code: "or", name: "Odisha", q: ["paddy", "OSDMA", "mining"] },
  { code: "pb", name: "Punjab", q: ["mandi", "Anaaj", "PSPCL"] },
  { code: "rj", name: "Rajasthan", q: ["tourism", "Jan Soochna", "Apna Khata"] },
  { code: "sk", name: "Sikkim", q: ["organic", "biodiversity", "tourism"] },
  { code: "tn", name: "Tamil Nadu", q: ["TANGEDCO", "Patta", "civil supplies"] },
  { code: "tg", name: "Telangana", q: ["Rythu", "GHMC", "budget"] },
  { code: "tr", name: "Tripura", q: ["rubber", "Jami", "municipality"] },
  { code: "up", name: "Uttar Pradesh", q: ["Bhulekh", "sugarcane", "e-Sathi"] },
  { code: "ut", name: "Uttarakhand", q: ["forest fire", "Char Dham", "UKPSC"] },
  { code: "wb", name: "West Bengal", q: ["Banglarbhumi", "land", "municipal"] },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text) };
  } catch {
    return { ok: false, status: res.status, json: { parseError: true, snippet: text.slice(0, 120) } };
  }
}

async function lists({ title, org, limit = 8 }) {
  const url = new URL("https://api.data.gov.in/lists");
  url.searchParams.set("format", "json");
  url.searchParams.set("filters[active]", "1");
  url.searchParams.set("notfilters[source]", "visualize.data.gov.in");
  url.searchParams.set("offset", "0");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort[updated]", "desc");
  url.searchParams.set("api-key", KEY);
  if (title) url.searchParams.set("filters[title]", title);
  if (org) url.searchParams.set("filters[org]", org);
  return getJson(url);
}

async function resource(id) {
  const url = new URL(`https://api.data.gov.in/resource/${id}`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("api-key", KEY);
  return getJson(url);
}

function recId(rec) {
  return String(rec.index_name ?? rec.indexName ?? rec.id ?? rec.resource_id ?? "").trim();
}

const out = [];
const skipped = [];

for (const portal of PORTALS) {
  const seen = new Set();
  const hits = [];

  const orgHit = await lists({ org: portal.name, limit: 12 });
  await sleep(80);
  const orgRecs = orgHit.json?.records ?? [];

  for (const q of portal.q) {
    const titleHit = await lists({ title: q, limit: 8 });
    await sleep(80);
    for (const rec of [...orgRecs, ...(titleHit.json?.records ?? [])]) {
      const id = recId(rec);
      if (!id || seen.has(id) || EXISTING.has(id)) continue;
      seen.add(id);
      const blob = JSON.stringify(rec).toLowerCase();
      const stateHit =
        blob.includes(portal.name.toLowerCase()) ||
        blob.includes(portal.code) ||
        portal.q.some((k) => blob.includes(k.toLowerCase()));
      if (!stateHit && orgRecs.every((r) => recId(r) !== id)) continue;
      hits.push(rec);
    }
  }

  const verified = [];
  for (const rec of hits.slice(0, 10)) {
    const id = recId(rec);
    const probe = await resource(id);
    await sleep(80);
    const records = probe.json?.records ?? [];
    const fields = (probe.json?.fields ?? []).map((f) => f.id ?? f.name).filter(Boolean);
    if (!probe.ok || records.length === 0) {
      skipped.push({
        code: portal.code,
        id,
        title: rec.title ?? rec.name,
        reason: !probe.ok ? `http ${probe.status}` : "empty",
      });
      continue;
    }
    verified.push({
      code: portal.code,
      state: portal.name,
      resourceId: id,
      title: rec.title ?? rec.name,
      org: rec.org,
      sector: rec.sector,
      fields: fields.slice(0, 12),
      sampleKeys: Object.keys(records[0] ?? {}).slice(0, 10),
    });
  }
  out.push({ code: portal.code, state: portal.name, found: verified.length, tools: verified });
  console.log(`${portal.code} ${portal.name}: ${verified.length} verified`);
}

writeFileSync(join(ROOT, "scripts/state-resource-candidates.json"), JSON.stringify({ out, skipped: skipped.slice(0, 80) }, null, 2));
console.log("wrote scripts/state-resource-candidates.json");
