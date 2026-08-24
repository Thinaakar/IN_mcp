import { describe, expect, it } from "vitest";
import { getCurrentCricketMatches } from "../src/cricket";
import { CPCB_AQI_RESOURCE_ID, DISTRICT_RAINFALL_RESOURCE_ID, HOSPITAL_DIRECTORY_RESOURCE_ID, MANDI_PRICES_RESOURCE_ID, PINCODE_CATALOG_ID, PINCODE_RESOURCE_ID } from "../src/data-gov";
import { INDIA_EARTHQUAKE_BOUNDS, slimEarthquakeFeatures } from "../src/earthquakes";
import { normalizeCurrency } from "../src/fx";
import { currentIndiaYear, filterHolidays, holidayYearFromInput, normalizeTallyfyHolidays } from "../src/holidays";
import { IFSC_PATTERN, normalizeIfsc } from "../src/ifsc";
import type { Env } from "../src/env";
import { parseCsv, parsePythonList } from "../src/transit";
import { RESOURCE_TOOL_DEFS, RESOURCE_TOOL_NAMES } from "../src/resource-catalog";
import { recordMentionsState, STATE_OPEN_DATA_PORTALS } from "../src/state-portals";
import {
  allToolsList,
  buildPublicCatalog,
  exclusiveToolsByCode,
  INDIA_SCOPE,
  parseMcpPath,
  parseScopeCode,
  STATE_CODES_28,
  STATE_PROFILES,
  toolNamesForScope,
} from "../src/scopes";
import { toolNames, toolResult } from "../src/tools";

describe("toolResult", () => {
  it("returns text and structured MCP content", () => {
    const result = toolResult({ ok: true });

    expect(result.structuredContent).toEqual({ ok: true });
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain('"ok": true');
  });
});

describe("parseCsv", () => {
  it("parses quoted commas", () => {
    const rows = parseCsv('name,stop_list\n"244-C","Vidhana Soudha, Maharani College"\n');
    expect(rows).toEqual([{ name: "244-C", stop_list: "Vidhana Soudha, Maharani College" }]);
  });
});

describe("parsePythonList", () => {
  it("extracts single-quoted GTFS helper lists", () => {
    expect(parsePythonList("['Vidhana Soudha', 'Maharani College']")).toEqual(["Vidhana Soudha", "Maharani College"]);
  });
});

describe("CPCB resource", () => {
  it("uses the data.gov.in real-time AQI resource ID", () => {
    expect(CPCB_AQI_RESOURCE_ID).toBe("3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69");
  });
});

describe("District rainfall resource", () => {
  it("uses the data.gov.in daily district rainfall resource ID", () => {
    expect(DISTRICT_RAINFALL_RESOURCE_ID).toBe("6c05cd1b-ed59-40c2-bc31-e314f39c6971");
  });
});

describe("Pincode directory resource", () => {
  it("maps the catalog ID to the queryable resource ID", () => {
    expect(PINCODE_CATALOG_ID).toBe("709e9d78-bf11-487d-93fd-d547d24cc0ef");
    expect(PINCODE_RESOURCE_ID).toBe("5c2f62fe-5afa-4119-a499-fec9d604d5bd");
  });
});

describe("Mandi prices resource", () => {
  it("uses the data.gov.in daily mandi price resource ID", () => {
    expect(MANDI_PRICES_RESOURCE_ID).toBe("9ef84268-d588-465a-a308-a864a43d0070");
  });
});

describe("Hospital directory resource", () => {
  it("uses the data.gov.in national hospital directory resource ID", () => {
    expect(HOSPITAL_DIRECTORY_RESOURCE_ID).toBe("98fa254e-c5f8-4910-a19b-4828939b477d");
  });
});

describe("IFSC lookup", () => {
  it("normalizes and validates an 11-character IFSC", () => {
    expect(normalizeIfsc(" hdfc0000001 ")).toBe("HDFC0000001");
    expect(IFSC_PATTERN.test("HDFC0CAGSBK")).toBe(true);
    expect(() => normalizeIfsc("HDFC")).toThrow(/11 characters/);
  });
});

describe("FX currencies", () => {
  it("normalizes ISO currency codes", () => {
    expect(normalizeCurrency("inr", "Base currency")).toBe("INR");
    expect(() => normalizeCurrency("rupee", "Base currency")).toThrow(/3-letter/);
  });
});

describe("India holidays helpers", () => {
  it("resolves year from date, filters rows, and normalizes Tallyfy payloads", () => {
    expect(holidayYearFromInput(undefined, "2026-08-15")).toBe(2026);
    expect(currentIndiaYear(new Date("2026-08-21T00:00:00Z"))).toBe(2026);
    expect(filterHolidays([{ date: "2026-01-26", name: "Republic Day" }, { date: "2026-08-15", name: "Independence Day" }], "2026-08-15")).toEqual([
      { date: "2026-08-15", name: "Independence Day" },
    ]);
    expect(
      normalizeTallyfyHolidays({
        country: { code: "IN" },
        holidays: [{ date: "2026-01-26", name: "Republic Day", local_name: "Gantantra Diwas", type: "national", observed_date: "2026-01-26" }],
      }),
    ).toEqual([
      {
        date: "2026-01-26",
        localName: "Gantantra Diwas",
        name: "Republic Day",
        countryCode: "IN",
        type: "national",
        observedDate: "2026-01-26",
        description: undefined,
      },
    ]);
  });
});

describe("India earthquake helpers", () => {
  it("uses the India bounding box and slims USGS features", () => {
    expect(INDIA_EARTHQUAKE_BOUNDS).toEqual({
      minlatitude: 6,
      maxlatitude: 38,
      minlongitude: 68,
      maxlongitude: 98,
    });
    const events = slimEarthquakeFeatures({
      features: [
        {
          id: "us123",
          properties: { mag: 4.2, place: "Andaman Islands", time: 1_724_000_000_000, url: "https://example.test" },
          geometry: { coordinates: [92.1, 12.5, 10] },
        },
      ],
    });
    expect(events[0]).toMatchObject({
      id: "us123",
      magnitude: 4.2,
      place: "Andaman Islands",
      longitude: 92.1,
      latitude: 12.5,
      depth_km: 10,
    });
  });
});

describe("CricAPI helpers", () => {
  it("requires CRICAPI_API_KEY", async () => {
    const env = {
      ENVIRONMENT: "test",
      MCP_SERVER_NAME: "test",
      MCP_SERVER_VERSION: "0.0.0",
    } as Env;
    await expect(getCurrentCricketMatches(env)).rejects.toThrow(/CRICAPI_API_KEY/);
  });
});

describe("Resource catalog tools", () => {
  it("registers 91 verified fixed data.gov.in tools with unique names", () => {
    expect(RESOURCE_TOOL_DEFS).toHaveLength(91);
    expect(RESOURCE_TOOL_NAMES).toHaveLength(91);
    expect(new Set(RESOURCE_TOOL_NAMES).size).toBe(91);
  });

  it("locks NCRB resource IDs resolved via dataset search", () => {
    const byName = Object.fromEntries(RESOURCE_TOOL_DEFS.map((d) => [d.name, d.resourceId]));
    expect(byName.in_crime_ipc_by_state).toBe("93550bf5-cc46-412c-beb3-d2e677bdb0a5");
    expect(byName.in_crime_sll_by_state).toBe("8d963bec-c368-4677-9875-7832411a91bd");
    expect(byName.in_crime_against_women).toBe("fee6c4c1-0c08-4527-9887-16567ec56a7f");
  });

  it("exposes catalog tools plus elevation and postal_code on the server tool list", () => {
    expect(toolNames).toContain("in_elevation");
    expect(toolNames).toContain("in_postal_code");
    expect(toolNames).toContain("in_dilrmp_clr");
    expect(toolNames).toContain("ka_bus_stops");
    expect(toolNames).toContain("mh_land_use");
    expect(toolNames).toContain("tn_open_data");
    expect(toolNames).not.toContain("in_bus_stops");
    expect(toolNames.length).toBe(25 + 2 + 91 + 28);
  });
});

describe("MCP catalog (single /mcp)", () => {
  it("accepts /mcp and /mcp/in and rejects per-state paths", () => {
    expect(parseMcpPath("/mcp")).toEqual({ ok: true, code: INDIA_SCOPE });
    expect(parseMcpPath("/mcp/in")).toEqual({ ok: true, code: INDIA_SCOPE });
    expect(parseMcpPath("/mcp/tn").ok).toBe(false);
    expect(parseMcpPath("/mcp/KA").ok).toBe(false);
    expect(parseMcpPath("/mcp/xx").ok).toBe(false);
    expect(parseScopeCode("andhra")).toBeUndefined();
    expect(parseScopeCode("ap")).toBe("ap");
  });

  it("lists 28 states and keeps common tools in allTools", () => {
    const catalog = buildPublicCatalog({
      name: "Monstarx India MCP",
      version: "0.1.0",
      origin: "https://in-mcp.monstarxapp.com",
    });
    expect(Object.keys(catalog.states)).toHaveLength(28);
    expect(STATE_CODES_28).toHaveLength(28);
    expect(catalog.states.tn).toEqual({ name: "Tamil Nadu", key: "tamilnadu" });
    expect(catalog.mcp).toBe("https://in-mcp.monstarxapp.com/mcp");
    expect(catalog.allTools).toContain("in_fx_rate");
    expect(catalog.allTools).toContain("in_mandi_prices");
    expect(catalog.allTools).toContain("in_crime_ipc_by_state");
    expect(catalog.allTools).toContain("in_dilrmp_northeast");
    expect(catalog.allTools).not.toContain("ka_bus_stops");
    expect(catalog.allTools).not.toContain("dl_fuel_prices");
    expect(catalog.karnataka).toEqual(expect.arrayContaining(["ka_bus_stops", "ka_bus_services", "ka_bus_routes", "ka_forest_cover", "ka_open_data"]));
    expect(catalog.tamilnadu).toEqual(expect.arrayContaining(["tn_open_data"]));
    expect(catalog.andhrapradesh).toEqual(expect.arrayContaining(["ap_open_data"]));
    expect(catalog.delhi).toEqual(expect.arrayContaining(["dl_fuel_prices", "dl_lpg_price"]));
    expect(catalog.maharashtra).toEqual(expect.arrayContaining(["mh_land_use", "mh_forest_cover", "mh_open_data"]));
  });

  it("names exclusive tools {code}_{topic} without in_ prefix", () => {
    const exclusive = Object.values(exclusiveToolsByCode()).flat();
    expect(exclusive.every((name) => !name.startsWith("in_"))).toBe(true);
    expect(exclusive).toContain("ka_bus_stops");
    expect(exclusive).toContain("mh_land_use");
    expect(allToolsList().every((name) => name.startsWith("in_"))).toBe(true);
  });

  it("registers the full union on /mcp", () => {
    const india = toolNamesForScope(INDIA_SCOPE);
    expect(india).toContain("in_fx_rate");
    expect(india).toContain("in_mandi_prices");
    expect(india).toContain("ka_bus_stops");
    expect(india).toContain("dl_fuel_prices");
    expect(india).toContain("tn_open_data");
    expect(india).toContain("in_dilrmp_northeast");
    expect([...india].sort()).toEqual([...toolNames].sort());
    expect(Object.keys(STATE_PROFILES).length).toBeGreaterThan(28);
  });

  it("maps all 28 states to {code}_open_data exclusive catalog tools", () => {
    expect(Object.keys(STATE_OPEN_DATA_PORTALS).sort()).toEqual([...STATE_CODES_28].sort());
    for (const code of STATE_CODES_28) {
      expect(toolNames).toContain(`${code}_open_data`);
    }
    expect(recordMentionsState({ org: "TNEGA, Tamil Nadu", title: "TANGEDCO" }, STATE_OPEN_DATA_PORTALS.tn)).toBe(true);
    expect(recordMentionsState({ org: "Karnataka", title: "Bhoomi" }, STATE_OPEN_DATA_PORTALS.tn)).toBe(false);
  });
});
