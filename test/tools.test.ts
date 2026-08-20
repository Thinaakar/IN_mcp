import { describe, expect, it } from "vitest";
import { CPCB_AQI_RESOURCE_ID, DISTRICT_RAINFALL_RESOURCE_ID, HOSPITAL_DIRECTORY_RESOURCE_ID, MANDI_PRICES_RESOURCE_ID, PINCODE_CATALOG_ID, PINCODE_RESOURCE_ID } from "../src/data-gov";
import { parseCsv, parsePythonList } from "../src/transit";
import { toolResult } from "../src/tools";

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
