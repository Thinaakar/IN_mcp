# Monstarx India MCP

Production-ready MCP server for India public data, maps/address lookup, weather, environment, and transport APIs.

This server exposes India-specific data sources through the Model Context Protocol (MCP), so AI tools and developer agents can query official and public India data without manually integrating every upstream API.

This is a **new** project. It does not modify the Singapore MCP.

## Planned Endpoint

| Environment | MCP URL | Health URL |
|---|---|---|
| Production | `https://in-mcp.monstarxapp.com/mcp` | `https://in-mcp.monstarxapp.com/health` |
| Staging | `https://in-mcp-staging.monstarxapp.com/mcp` | `https://in-mcp-staging.monstarxapp.com/health` |

## MCP Client Setup

One Worker, one MCP URL. Common tools are in `allTools` (pass `"state": "Tamil Nadu"` when a tool supports it). State-exclusive tools are named `{code}_{topic}` (for example `ka_bus_routes`, `tn_doctors_beds`) and are still called on `/mcp`. Catalog: `GET /` or `GET /scopes`.

```json
{
  "mcpServers": {
    "monstarx-india": {
      "url": "https://in-mcp.monstarxapp.com/mcp"
    }
  }
}
```

## Tools

### Dataset Catalogue

| Tool | Purpose |
|---|---|
| `in_datasets_search` | Search data.gov.in datasets by keyword |
| `in_dataset_metadata` | Get metadata for a data.gov.in resource |
| `in_dataset_query` | Query rows from a tabular data.gov.in resource |

### Weather And Environment

| Tool | Purpose |
|---|---|
| `in_weather_2h` | Next 2-hour forecast for an Indian city |
| `in_weather_24h` | 24-hour forecast |
| `in_weather_4day` | 4-day forecast |
| `in_uv_index` | UV index |
| `in_rainfall` | Precipitation / rainfall |
| `in_air_temperature` | Air temperature |
| `in_relative_humidity` | Relative humidity |
| `in_air_quality` | PM2.5 / PM10 / AQI, optional CPCB rows |

### Transport

| Tool | Purpose |
|---|---|
| `ka_bus_stops` | BMTC bus stop catalogue (Karnataka exclusive) |
| `ka_bus_services` | BMTC bus service catalogue |
| `ka_bus_routes` | BMTC route-stop rows |

BMTC tools are Karnataka-exclusive (`ka_bus_*`) and use public static GTFS. No API key required.

### State exclusive tools

State-only tools use `{code}_{topic}` (no `in_` prefix) and stay on `POST /mcp`. Prefer a verified resource-ID tool when the domain matches; keep `{code}_open_data` as catalog search for everything else.

Each of the 28 states has `{code}_open_data`. It searches **api.data.gov.in** scoped to that state. Pass `query` for a domain keyword (TANGEDCO, Bhoomi, flood, …), then `in_dataset_query` with the returned `dataset_id`.

Verified fixed-resource examples (full list is on `GET /scopes`):

| Tool | Rows |
|---|---|
| `ap_procurement` / `ap_rbk_procurement` | AP Markfed district and RBK procurement |
| `tn_doctors_beds` / `tn_food_grain_prices` / `tn_rainfall` | Tamil Nadu health ratio, grain prices, rainfall |
| `ka_bmtc_finance` / `ka_crime_review` | BMTC finance and Karnataka crime review |
| `mh_fair_price_shops` / `mh_stamp_duty` | Maharashtra FPS locations and stamp duty |
| `gj_surat_complaints` / `gj_surat_garbage` | Surat civic complaints and garbage collection |

Arunachal Pradesh, Goa, Jharkhand, Manipur, and Tripura have `{code}_open_data` only: no state-department resource ID verified as returning rows (national Rajya Sabha tables are not used as exclusive tools). TANGEDCO, Meebhoomi, and Bhoomi feeds were not found as queryable exclusive IDs — use `{code}_open_data` then `in_dataset_query`.

### Maps And Address

| Tool | Purpose |
|---|---|
| `in_address_search` | Search Indian addresses |
| `in_geocode` | Convert address/place to coordinates |
| `in_reverse_geocode` | Find addresses near coordinates |

### Banking, FX, Holidays, Earthquakes

| Tool | Purpose |
|---|---|
| `in_ifsc_lookup` | Bank branch by IFSC, or search by city/district |
| `in_fx_rate` | Currency rate vs INR (default USD → INR) |
| `in_holidays` | Indian public holidays for a year (Tallyfy, not official gazette) |
| `in_earthquakes` | USGS earthquakes in the India bounding box |

### Cricket

| Tool | Purpose |
|---|---|
| `in_cricket_live` | Current / live cricket matches (CricAPI) |
| `in_cricket_matches` | Cricket match list / schedule (CricAPI) |

Requires `CRICAPI_API_KEY` (free signup at [cricketdata.org](https://cricketdata.org/)). Free tier is about 100 hits/day.

## Data Sources

| Source | Used For |
|---|---|
| data.gov.in | Dataset search, metadata, tabular querying, CPCB AQI |
| Open-Meteo | Weather, rainfall, temperature, humidity, UV, air quality |
| OpenStreetMap Nominatim | Address search, geocoding, reverse geocoding |
| OpenTransitData | Buses, trains, traffic (key required) |
| Razorpay IFSC | Bank IFSC lookup |
| Frankfurter / ExchangeRate-API | FX rates |
| Tallyfy National Holidays | Public holidays |
| USGS | Earthquakes near India |
| CricAPI / CricketData.org | Live cricket scores and match lists |

## Local Development

```bash
npm install
npm run dev
```

Local MCP endpoint (after `npm run dev`):

```txt
http://127.0.0.1:8787/mcp
```

`GET http://127.0.0.1:8787/scopes` returns `allTools` plus 28 state keys. Keep `npm run dev` running, then reload MCP servers in Cursor. If nothing is listening on port 8787, Cursor caches the failed connect until you reconnect.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run check
```

## Required Secrets

| Secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Deploy Worker |
| `DATA_GOV_IN_API_KEY` | data.gov.in API key |
| `CRICAPI_API_KEY` | CricAPI / CricketData.org key (free signup) |
| `MAPS_API_KEY` | Optional maps provider key |
| `TRANSIT_API_KEY` | OpenTransitData / city transit key |
| `BUILD_SHA` | Synced automatically from GitHub Actions |
