#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = readFileSync(join(ROOT, ".dev.vars"), "utf8")
  .split(/\r?\n/)
  .find((line) => line.startsWith("DATA_GOV_IN_API_KEY="))
  ?.slice("DATA_GOV_IN_API_KEY=".length)
  ?.trim();

const PORTALS = [
  { code: "or", name: "Odisha", q: ["paddy", "mining", "flood"] },
  { code: "pb", name: "Punjab", q: ["mandi", "PSPCL", "wheat"] },
  { code: "rj", name: "Rajasthan", q: ["tourism", "Jan Soochna"] },
  { code: "sk", name: "Sikkim", q: ["organic", "tourism"] },
  { code: "tn", name: "Tamil Nadu", q: ["TANGEDCO", "Patta", "civil supplies"] },
  { code: "tg", name: "Telangana", q: ["Rythu", "GHMC"] },
  { code: "tr", name: "Tripura", q: ["rubber", "land"] },
  { code: "up", name: "Uttar Pradesh", q: ["Bhulekh", "sugarcane"] },
  { code: "ut", name: "Uttarakhand", q: ["forest fire", "tourism"] },
  { code: "wb", name: "West Bengal", q: ["Banglarbhumi", "land"] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text) };
  } catch {
    return { ok: false, status: res.status, json: {} };
  }
}

async function lists({ title, org }) {
  const url = new URL("https://api.data.gov.in/lists");
  url.searchParams.set("format", "json");
  url.searchParams.set("filters[active]", "1");
  url.searchParams.set("notfilters[source]", "visualize.data.gov.in");
  url.searchParams.set("offset", "0");
  url.searchParams.set("limit", "10");
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
for (const portal of PORTALS) {
  await sleep(600);
  const orgHit = await lists({ org: portal.name });
  await sleep(400);
  const recs = [...(orgHit.json?.records ?? [])];
  for (const q of portal.q.slice(0, 1)) {
    await sleep(400);
    const titleHit = await lists({ title: q });
    for (const rec of titleHit.json?.records ?? []) {
      const blob = JSON.stringify(rec).toLowerCase();
      if (blob.includes(portal.name.toLowerCase())) recs.push(rec);
    }
  }
  const seen = new Set();
  const verified = [];
  for (const rec of recs) {
    const id = recId(rec);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    await sleep(450);
    const probe = await resource(id);
    const records = probe.json?.records ?? [];
    if (!probe.ok || !records.length) {
      console.log(` skip ${portal.code} ${id} ${probe.status} n=${records.length}`);
      continue;
    }
    verified.push({
      code: portal.code,
      state: portal.name,
      resourceId: id,
      title: rec.title ?? rec.name,
      org: rec.org,
      sampleKeys: Object.keys(records[0]).slice(0, 10),
    });
    if (verified.length >= 4) break;
  }
  out.push({ code: portal.code, found: verified.length, tools: verified });
  console.log(`${portal.code}: ${verified.length}`);
}

writeFileSync(join(ROOT, "scripts/state-resource-candidates-rest.json"), JSON.stringify(out, null, 2));
console.log("wrote rest");
