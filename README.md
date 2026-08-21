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
| `in_bus_arrival` | Live bus arrivals |
| `in_bus_stops` | Bus stop catalogue |
| `in_bus_services` | Bus service catalogue |
| `in_bus_routes` | Bus route-stop rows |
| `in_train_service_alerts` | Train service alerts |
| `in_traffic_incidents` | Traffic incidents |

Transport tools require `TRANSIT_API_KEY`.

### Maps And Address

| Tool | Purpose |
|---|---|
| `in_address_search` | Search Indian addresses |
| `in_geocode` | Convert address/place to coordinates |
| `in_reverse_geocode` | Find addresses near coordinates |

### Banking, FX, Holidays, Earthquakes

| Tool | Purpose |
|---|---|
| `in_ifsc_lookup` | Bank branch details for an 11-character IFSC |
| `in_fx_rate` | Currency rate vs INR (default USD → INR) |
| `in_holidays` | Indian public holidays for a year (Tallyfy, not official gazette) |
| `in_earthquakes` | USGS earthquakes in the India bounding box |

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

## Local Development

```bash
npm install
npm run dev
```

Local MCP endpoint:

```txt
http://localhost:8787/mcp
```

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
| `MAPS_API_KEY` | Optional maps provider key |
| `TRANSIT_API_KEY` | OpenTransitData / city transit key |
| `BUILD_SHA` | Synced automatically from GitHub Actions |
