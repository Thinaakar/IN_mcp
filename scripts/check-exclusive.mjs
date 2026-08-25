import { exclusiveToolsByCode, commonToolsList, sharedToolsList, allRegisteredToolNames } from "../src/scopes.ts";
import { RESOURCE_TOOL_DEFS } from "../src/resource-catalog.ts";

const ex = exclusiveToolsByCode();
const allEx = Object.values(ex).flat();
const common = new Set(commonToolsList());
const shared = new Set(sharedToolsList());
const registered = new Set(allRegisteredToolNames());
const resourceByName = Object.fromEntries(RESOURCE_TOOL_DEFS.map((d) => [d.name, d]));

const counts = {};
for (const n of allEx) counts[n] = (counts[n] || 0) + 1;
const dupes = Object.entries(counts).filter(([, c]) => c > 1);

const inCommon = allEx.filter((n) => common.has(n));
const inShared = allEx.filter((n) => shared.has(n));
const notRegistered = allEx.filter((n) => !registered.has(n));

const openData = allEx.filter((n) => n.endsWith("_open_data"));
const domain = allEx.filter((n) => !n.endsWith("_open_data"));

const prefixMismatch = [];
for (const [code, names] of Object.entries(ex)) {
  for (const n of names) {
    if (!n.startsWith(`${code}_`)) prefixMismatch.push({ code, n });
  }
}

const ids = {};
for (const n of domain) {
  const def = resourceByName[n];
  if (!def?.resourceId) continue;
  (ids[def.resourceId] ??= []).push(n);
}
const dupIds = Object.entries(ids).filter(([, ns]) => ns.length > 1);

const domainMissing = domain.filter(
  (n) => !resourceByName[n] && !["ka_bus_stops", "ka_bus_services", "ka_bus_routes"].includes(n),
);

const noExclusiveFlag = domain
  .map((n) => resourceByName[n])
  .filter(Boolean)
  .filter((d) => !d.exclusiveTo)
  .map((d) => d.name);

console.log(
  JSON.stringify(
    {
      states: Object.keys(ex).length,
      exclusiveToolCount: allEx.length,
      uniqueNames: new Set(allEx).size,
      duplicateNames: dupes,
      overlapCommon: inCommon,
      overlapShared: inShared,
      notRegistered,
      openDataCount: openData.length,
      domainCount: domain.length,
      domainMissingFromResourceCatalog: domainMissing,
      noExclusiveFlag,
      prefixMismatch,
      duplicateResourceIds: dupIds,
      sample: { ap: ex.ap, ar: ex.ar, ka: ex.ka, tn: ex.tn, gj: ex.gj },
    },
    null,
    2,
  ),
);
