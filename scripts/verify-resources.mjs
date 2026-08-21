#!/usr/bin/env node
/**
 * Verify data.gov.in resource IDs. Usage:
 *   node scripts/verify-resources.mjs a8618f5c-5fd7-4cd4-ba02-e9371d17a6a2 ...
 * Reads DATA_GOV_IN_API_KEY from .dev.vars or env.
 */
import fs from "fs";
import path from "path";

function loadKey() {
  if (process.env.DATA_GOV_IN_API_KEY?.trim()) return process.env.DATA_GOV_IN_API_KEY.trim();
  const file = path.resolve(".dev.vars");
  if (!fs.existsSync(file)) throw new Error("No DATA_GOV_IN_API_KEY");
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*DATA_GOV_IN_API_KEY=(.+)\s*$/);
    if (m) return m[1].trim();
  }
  throw new Error("DATA_GOV_IN_API_KEY not found in .dev.vars");
}

const key = loadKey();
const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("Pass resource IDs as arguments");
  process.exit(1);
}

const results = [];
for (const id of ids) {
  const url = `https://api.data.gov.in/resource/${id}?api-key=${encodeURIComponent(key)}&format=json&limit=5`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "Monstarx-India-MCP/0.1" } });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      results.push({ id, ok: false, status: res.status, reason: `non-json: ${text.slice(0, 120)}` });
      continue;
    }
    const records = json.records ?? [];
    const total = json.total ?? json.count;
    const fields = (json.field ?? json.fields ?? []).slice(0, 12).map((f) => f.id ?? f.name ?? f);
    if (!res.ok) {
      results.push({ id, ok: false, status: res.status, reason: json.message ?? json.errorMsg ?? res.statusText, fields });
    } else if (!Array.isArray(records) || records.length === 0) {
      results.push({ id, ok: false, status: res.status, reason: "empty records", total, fields });
    } else {
      results.push({ id, ok: true, status: res.status, total, sampleKeys: Object.keys(records[0] ?? {}), fields, recordCount: records.length });
    }
  } catch (error) {
    results.push({ id, ok: false, reason: error instanceof Error ? error.message : String(error) });
  }
}

console.log(JSON.stringify(results, null, 2));
