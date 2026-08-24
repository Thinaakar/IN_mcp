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
import { INDIA_SCOPE, parseMcpPath, parseScopeCode, STATE_PROFILES, toolNamesForScope } from "../src/scopes";
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
    expect(toolNames.length).toBe(25 + 2 + 91);
  });
});

describe("MCP scopes", () => {
  it("parses /mcp as India and /mcp/tn as Tamil Nadu", () => {
    expect(parseMcpPath("/mcp")).toEqual({ ok: true, code: INDIA_SCOPE });
    expect(parseMcpPath("/mcp/in")).toEqual({ ok: true, code: INDIA_SCOPE });
    expect(parseMcpPath("/mcp/tn")).toEqual({ ok: true, code: "tn" });
    expect(parseMcpPath("/mcp/KA")).toEqual({ ok: true, code: "ka" });
    expect(parseMcpPath("/mcp/xx").ok).toBe(false);
    expect(parseScopeCode("andhra")).toBeUndefined();
    expect(parseScopeCode("ap")).toBe("ap");
  });

  it("keeps nationwide tools on India and excludes state-grain datasets", () => {
    const india = toolNamesForScope("in");
    expect(india).toContain("in_fx_rate");
    expect(india).toContain("in_cricket_live");
    expect(india).toContain("in_tourism_gdp");
    expect(india).toContain("in_datasets_search");
    expect(india).not.toContain("in_mandi_prices");
    expect(india).not.toContain("in_crime_ipc_by_state");
    expect(india).not.toContain("in_bus_stops");
    expect(india).not.toContain("in_fuel_prices_delhi");
  });

  it("locks Tamil Nadu to state tools without national extras or Karnataka feeds", () => {
    const tn = toolNamesForScope("tn");
    expect(tn).toContain("in_mandi_prices");
    expect(tn).toContain("in_crime_ipc_by_state");
    expect(tn).toContain("in_weather_2h");
    expect(tn).not.toContain("in_fx_rate");
    expect(tn).not.toContain("in_bus_stops");
    expect(tn).not.toContain("in_forest_cover_karnataka");
    expect(tn).not.toContain("in_tourism_gdp");
  });

  it("exposes Karnataka-only BMTC and forest tools on /mcp/ka", () => {
    const ka = toolNamesForScope("ka");
    expect(ka).toContain("in_bus_stops");
    expect(ka).toContain("in_forest_cover_karnataka");
    expect(ka).toContain("in_mandi_prices");
    expect(ka).not.toContain("in_fuel_prices_delhi");
    expect(ka).not.toContain("in_cricket_matches");
  });

  it("puts DILRMP northeast and Delhi fuel on those scopes only", () => {
    expect(toolNamesForScope("as")).toContain("in_dilrmp_northeast");
    expect(toolNamesForScope("tn")).not.toContain("in_dilrmp_northeast");
    expect(toolNamesForScope("in")).not.toContain("in_dilrmp_northeast");
    expect(toolNamesForScope("dl")).toContain("in_fuel_prices_delhi");
    expect(toolNamesForScope("mh")).toContain("in_forest_cover_maharashtra");
    expect(toolNamesForScope("mh")).not.toContain("in_forest_cover_karnataka");
  });

  it("covers every registered tool on India or some state face", () => {
    const union = new Set(toolNamesForScope(INDIA_SCOPE));
    for (const code of Object.keys(STATE_PROFILES)) {
      for (const name of toolNamesForScope(code)) {
        union.add(name);
      }
    }
    expect([...union].sort()).toEqual([...toolNames].sort());
  });
});
