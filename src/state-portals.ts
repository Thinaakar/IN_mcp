export interface StateOpenDataPortal {
  code: string;
  name: string;
  /** State OGD / CKAN catalog (often an HTML skin over data.gov.in). */
  portal: string;
  apiSetu?: string;
  extraPortals?: string[];
  /** Keywords from the state's public-data domains; used as the default title search. */
  defaultQuery: string;
  domains: string;
}

export const STATE_OPEN_DATA_PORTALS: Record<string, StateOpenDataPortal> = {
  ap: {
    code: "ap",
    name: "Andhra Pradesh",
    portal: "https://ap.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/andhra-pradesh",
    defaultQuery: "Meebhoomi",
    domains: "Meeseva services, APTRANSCO power, Land (Meebhoomi) records",
  },
  ar: {
    code: "ar",
    name: "Arunachal Pradesh",
    portal: "https://arunachal.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/arunachal-pradesh",
    defaultQuery: "hydro",
    domains: "Hydro statistics, tribal affairs, Border Area Development (BADP)",
  },
  as: {
    code: "as",
    name: "Assam",
    portal: "https://assam.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/assam",
    defaultQuery: "flood",
    domains: "Flood management, ASDMA disaster alerts, tea board statistics",
  },
  br: {
    code: "br",
    name: "Bihar",
    portal: "https://bihar.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/bihar",
    defaultQuery: "land",
    domains: "RTPS citizen services, land registration (Biharbhumi), education",
  },
  ct: {
    code: "ct",
    name: "Chhattisgarh",
    portal: "https://chhattisgarh.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/chhattisgarh",
    defaultQuery: "paddy",
    domains: "PDS rice procurement metrics, mining revenue, forest produce",
  },
  ga: {
    code: "ga",
    name: "Goa",
    portal: "https://goa.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/goa",
    defaultQuery: "tourism",
    domains: "Tourism statistics, port traffic, municipal water/power meters",
  },
  gj: {
    code: "gj",
    name: "Gujarat",
    portal: "https://gujarat.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/gujarat",
    defaultQuery: "GIDC",
    domains: "AnyROR land registries, GIDC industrial data, GSECL grid stats",
  },
  hr: {
    code: "hr",
    name: "Haryana",
    portal: "https://haryana.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/haryana",
    defaultQuery: "Saral",
    domains: "Parivar Pehchan Patra (PPP) services, Saral e-governance metrics",
  },
  hp: {
    code: "hp",
    name: "Himachal Pradesh",
    portal: "https://hp.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/himachal-pradesh",
    defaultQuery: "horticulture",
    domains: "Horticulture, HPSEB hydropower generation, e-Himsabha data",
  },
  jh: {
    code: "jh",
    name: "Jharkhand",
    portal: "https://jharkhand.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/jharkhand",
    defaultQuery: "mineral",
    domains: "Mineral production (Jharbhoomi), rural welfare, forest coverage",
  },
  ka: {
    code: "ka",
    name: "Karnataka",
    portal: "https://karnataka.data.gov.in",
    extraPortals: ["https://bengaluru.data.gov.in"],
    defaultQuery: "Bhoomi",
    domains: "Bhoomi land records, KSRTC transit, BBMP municipal services",
  },
  kl: {
    code: "kl",
    name: "Kerala",
    portal: "https://kerala.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/kerala",
    defaultQuery: "LSGD",
    domains: "LSGD local body finances, Kerala State IT Mission, health surveys",
  },
  mp: {
    code: "mp",
    name: "Madhya Pradesh",
    portal: "https://mp.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/madhya-pradesh",
    defaultQuery: "mandi",
    domains: "MP e-District, agricultural mandi prices, MPBSE records",
  },
  mh: {
    code: "mh",
    name: "Maharashtra",
    portal: "https://mahadps.maharashtra.gov.in",
    extraPortals: ["https://opendata.tribal.gov.in"],
    defaultQuery: "tribal",
    domains: "BMC Mumbai open data, tribal welfare, Mahadbt beneficiary lists",
  },
  mn: {
    code: "mn",
    name: "Manipur",
    portal: "https://manipur.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/manipur",
    defaultQuery: "agriculture",
    domains: "Hill development schemes, agricultural output, e-District",
  },
  ml: {
    code: "ml",
    name: "Meghalaya",
    portal: "https://meghalaya.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/meghalaya",
    defaultQuery: "mining",
    domains: "Mining royalty, rainfall observation records, e-Prastuti",
  },
  mz: {
    code: "mz",
    name: "Mizoram",
    portal: "https://mizoram.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/mizoram",
    defaultQuery: "forest",
    domains: "Forest conservation stats, border trade, PHE water supply data",
  },
  nl: {
    code: "nl",
    name: "Nagaland",
    portal: "https://nagaland.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/nagaland",
    defaultQuery: "handloom",
    domains: "Village Development Boards (VDB), handloom/handicrafts",
  },
  or: {
    code: "or",
    name: "Odisha",
    portal: "https://odisha.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/odisha",
    defaultQuery: "paddy",
    domains: "OSDMA disaster management, mining data, paddy procurement",
  },
  pb: {
    code: "pb",
    name: "Punjab",
    portal: "https://punjab.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/punjab",
    defaultQuery: "mandi",
    domains: "Mandi arrivals, Anaaj Kharid wheat/paddy, PSPCL power info",
  },
  rj: {
    code: "rj",
    name: "Rajasthan",
    portal: "https://rajasthan.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/rajasthan",
    defaultQuery: "tourism",
    domains: "Jan Soochna portal APIs, Apna Khata, tourism arrival records",
  },
  sk: {
    code: "sk",
    name: "Sikkim",
    portal: "https://sikkim.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/sikkim",
    defaultQuery: "organic",
    domains: "Organic farming registries, biodiversity maps, eco-tourism",
  },
  tn: {
    code: "tn",
    name: "Tamil Nadu",
    portal: "https://tn.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/tamil-nadu",
    defaultQuery: "TANGEDCO",
    domains: "TANGEDCO power, Patta/Chitta land data, civil supplies",
  },
  tg: {
    code: "tg",
    name: "Telangana",
    portal: "https://data.telangana.gov.in",
    defaultQuery: "Rythu",
    domains: "GHMC ward metrics, Rythu Bandhu, budget line items",
  },
  tr: {
    code: "tr",
    name: "Tripura",
    portal: "https://tripura.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/tripura",
    defaultQuery: "rubber",
    domains: "Rubber cultivation, e-Municipality civic services, Jami land data",
  },
  up: {
    code: "up",
    name: "Uttar Pradesh",
    portal: "https://up.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/uttar-pradesh",
    defaultQuery: "sugarcane",
    domains: "Bhulekh land records, sugarcane/sugar mill output, e-Sathi",
  },
  ut: {
    code: "ut",
    name: "Uttarakhand",
    portal: "https://uttarakhand.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/uttarakhand",
    defaultQuery: "forest fire",
    domains: "Char Dham yatra traffic, UKPSC datasets, forest fire logs",
  },
  wb: {
    code: "wb",
    name: "West Bengal",
    portal: "https://wb.data.gov.in",
    apiSetu: "https://apisetu.gov.in/directory/state/west-bengal",
    defaultQuery: "land",
    domains: "Banglarbhumi land records, municipal corporation services",
  },
};

export function recordMentionsState(record: Record<string, unknown>, portal: StateOpenDataPortal): boolean {
  const blob = JSON.stringify(record).toLowerCase();
  const needles = [portal.name, portal.code].map((value) => value.toLowerCase());
  if (portal.name === "Andhra Pradesh") needles.push("andhra");
  if (portal.name === "Arunachal Pradesh") needles.push("arunachal");
  if (portal.name === "Himachal Pradesh") needles.push("himachal");
  if (portal.name === "Madhya Pradesh") needles.push("madhya");
  if (portal.name === "Uttar Pradesh") needles.push("uttar pradesh", "u.p.");
  if (portal.name === "West Bengal") needles.push("west bengal", "bangla");
  if (portal.name === "Tamil Nadu") needles.push("tamil");
  return needles.some((needle) => blob.includes(needle));
}

export function slimCatalogRecord(record: Record<string, unknown>): Record<string, unknown> {
  const datasetId = record.index_name ?? record.indexName ?? record.id ?? record.resource_id;
  return {
    title: record.title ?? record.name,
    org: record.org,
    org_type: record.org_type,
    sector: record.sector,
    source: record.source,
    dataset_id: datasetId,
    updated: record.updated ?? record.changed ?? record.created,
  };
}
