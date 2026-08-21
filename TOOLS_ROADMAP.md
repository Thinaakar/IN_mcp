# India MCP — Tools Roadmap

Last updated: 2026-08-21

This document lists **unique** tools only (no duplicates).  
**Free sources only** — data.gov.in + existing free public APIs (Open-Meteo, Nominatim, Razorpay IFSC, Frankfurter, USGS, BMTC GTFS, Tallyfy holidays, CricAPI).  
No paid / partner live-rail APIs.

---

## Summary

| Status | Count |
|---|---|
| Already covered (live) | **118** |
| Skipped (see `SKIPPED_TOOLS.md`) | **4** |
| Still planned | **0** |
| **Target unique tools** | **122** (118 shipped + 4 skipped) |

---

## 1. Already covered (118)

These are registered in `src/tools.ts` (+ `src/resource-catalog.ts` for fixed data.gov.in resources).

### Dataset catalogue (3)

| Tool | Purpose |
|---|---|
| `in_datasets_search` | Search data.gov.in datasets by keyword |
| `in_dataset_metadata` | Metadata for a resource ID |
| `in_dataset_query` | Query tabular rows from a resource |

### Weather & environment (8)

| Tool | Purpose |
|---|---|
| `in_weather_2h` | Next 2-hour forecast |
| `in_weather_24h` | 24-hour forecast |
| `in_weather_4day` | 4-day forecast |
| `in_uv_index` | UV index |
| `in_rainfall` | District rainfall (IMD via data.gov.in, Open-Meteo fallback) |
| `in_air_temperature` | Air temperature |
| `in_relative_humidity` | Relative humidity |
| `in_air_quality` | CPCB AQI (Open-Meteo fallback) |

### Maps & address (3)

| Tool | Purpose |
|---|---|
| `in_address_search` | India Post pincode / address (Nominatim fallback) |
| `in_geocode` | Address / pincode → coordinates |
| `in_reverse_geocode` | Coordinates → nearby address |

### Transit — BMTC Bengaluru static (3)

| Tool | Purpose |
|---|---|
| `in_bus_stops` | BMTC bus stops |
| `in_bus_services` | BMTC bus services |
| `in_bus_routes` | BMTC route-stop rows |

### India domain extras (10)

| Tool | Purpose |
|---|---|
| `in_mandi_prices` | Agmarknet daily mandi prices |
| `in_hospital_directory` | National hospital directory |
| `in_ifsc_lookup` | Bank IFSC lookup / city search |
| `in_fx_rate` | Currency rate vs INR |
| `in_holidays` | Public holidays (Tallyfy) |
| `in_earthquakes` | USGS India-bbox earthquakes |
| `in_cricket_live` | CricAPI current matches |
| `in_cricket_matches` | CricAPI match list |
| `in_elevation` | Open-Meteo DEM elevation |
| `in_postal_code` | India Post pincode directory |

### Land — DILRMP & related (15)

| Tool | Resource ID |
|---|---|
| `in_dilrmp_clr` | `a8618f5c-5fd7-4cd4-ba02-e9371d17a6a2` |
| `in_dilrmp_registration` | `25071cca-9cf6-4e80-adfd-ddcdcf618f56` |
| `in_dilrmp_maps` | `859a6bb9-acc0-4092-acd6-8f9596049d1c` |
| `in_dilrmp_funds` | `63c490ad-e2c0-46ba-a5fe-bde80b991c8f` |
| `in_dilrmp_districts` | `e0044f1d-bba9-4da6-90ec-cfbee247c7b3` |
| `in_dilrmp_northeast` | `d45e628f-88e8-4440-9d51-9a598901a1df` |
| `in_dilrmp_budget` | `089b3479-39bc-415c-802b-b9952828888d` |
| `in_land_use_maharashtra` | `0ce90a70-a714-4e77-817e-b6ac1cc9c286` |
| `in_land_use_chhattisgarh` | `a9a473d6-691b-4a25-a995-23098f2a7abf` |
| `in_land_use_haryana` | `8c06e8f1-3bb1-4299-b032-49ef2527d6a8` |
| `in_land_use_delhi` | `0c484052-8c1b-4ff9-a3fc-4fadc73b79ab` |
| `in_land_use_taluka` | `a0b5a8e0-6146-443d-bb76-7a87017a1a6b` |
| `in_wasteland_district` | `3d6f37c7-fe12-4a00-a6f3-1e66dba0c83a` |
| `in_wasteland_treated` | `a568d98b-99f6-4726-af5a-6a603e650bcf` |
| `in_land_acquisition_delays` | `ddc7d28f-fdbc-4d55-be72-97df5fee1ea9` |

### Tourism (19)

| Tool | Resource ID |
|---|---|
| `in_fta_by_age` | `f6a89e6e-f900-4c59-975e-6967b85eef5c` |
| `in_fta_by_country` | `6f81905b-5c66-458f-baa3-74f870de5cd0` |
| `in_approved_hotels` | `f2cfc41a-b305-4d54-9682-4d944041b49c` |
| `in_hotels_2019` | `705ac8fe-591e-4787-8f55-0e7e1bad1c3b` |
| `in_hotels_by_state` | `831cb80f-d729-4504-80cf-af7893dbc044` |
| `in_hotel_guests` | `8a4245c3-1e26-4988-90a4-2e40d735f0be` |
| `in_top_monuments` | `02e72f1b-d82d-4512-a105-7b4373d6fa85` |
| `in_monument_inflow` | `93ea5b6a-7476-4240-8434-e334aacb6837` |
| `in_monument_revenue` | `7deaefd1-4a79-4b4d-9c9b-0b53f1a871ae` |
| `in_monument_conservation` | `e0330456-aa9b-4d7a-8637-da706ad6f259` |
| `in_tourism_gdp` | `9929bf20-394a-48c8-b944-1e2ba35d97e5` |
| `in_tourism_employment` | `015013db-9937-4f58-8484-890fdf5d40c2` |
| `in_tourism_infra` | `177572f5-102a-406e-80ac-40223899a73a` |
| `in_prashad_projects` | `2636eeed-e5cf-4576-82ae-767cd7c18dd6` |
| `in_prashad_funds` | `c1337530-2d70-42fd-9fc2-4a7fa2eec7d3` |
| `in_prashad_completed` | `02753062-2183-4323-a58f-a5ea284efa4c` |
| `in_tourism_festivals` | `74ceeff8-dd4d-4388-a469-af12a813e183` |
| `in_lighthouse_tourism` | `6a5ab875-d240-4614-b359-485e09876391` |
| `in_tourist_places` | `9c41624a-94f4-4cb3-a0fc-24aa963bc82c` |

### Railway stats (11)

| Tool | Resource ID |
|---|---|
| `in_railway_route_km` | `cb5d0c04-000d-4bcf-beb1-0e9dcf52174c` |
| `in_railway_earnings` | `e10a5cca-06ea-4201-a8f9-0d76d8df21a7` |
| `in_railway_accidents` | `b4a9433e-a762-4427-a84c-8e7bd31160ff` |
| `in_railway_crossing_accidents` | `62bb2ac5-ebf5-489d-9928-1d051bb8e1ce` |
| `in_railway_infra_gujarat` | `f2d31cb3-4b5e-401a-9593-2004b524b542` |
| `in_railway_infra_wb` | `750dfd29-b629-4220-bbf3-8e2ed4882058` |
| `in_grp_crimes` | `015dfa82-0fa7-4d90-ac92-e7fe37a3ad2b` |
| `in_rpf_cases` | `a8555a65-8d6b-43c8-911e-cb399798e1d8` |
| `in_sll_railway_crimes` | `e920a77f-125b-4691-a6da-a2f8ea74bc8f` |
| `in_railway_works_status` | `99ee1583-40e3-4108-ad07-995d78ce3dc1` |
| `in_land_acquisition_wb` | `36cc5e04-d47a-4ee6-9fd6-a6b0bcd05c15` |

### Fuel / LPG (5)

| Tool | Resource ID |
|---|---|
| `in_fuel_prices_delhi` | `02327d37-dbaa-4cf9-a908-a7eecc428d25` |
| `in_fuel_prices_delhi_avg` | `e336a512-2dfe-4e4b-8d00-bc1b11e41964` |
| `in_fuel_vat_by_state` | `8d939c2e-a2ff-4b7f-adc4-4372f7def526` |
| `in_lpg_price_delhi` | `4dc5b88c-f356-49d5-86e7-d8c4eb7c2a27` |
| `in_ethanol_blending` | `1a0adf5b-7c45-4ed0-a9f3-80653c9b6d70` |

### Road accidents — MoRTH (4)

| Tool | Resource ID |
|---|---|
| `in_road_accidents_state_highways` | `3ad4e5c1-37a6-4b34-a851-2c88ba993347` |
| `in_road_accidents_trend` | `12d39b69-688d-48e4-8aae-6035bff3129f` |
| `in_road_fatalities_nh` | `1b6954d8-2155-44cd-9027-a1ea711b93bb` |
| `in_road_accidents_urban_rural` | `294bbc95-40d8-4877-9886-59e7e0ba0eba` |

### Crime — NCRB (3)

| Tool | Resource ID | Notes |
|---|---|---|
| `in_crime_ipc_by_state` | `93550bf5-cc46-412c-beb3-d2e677bdb0a5` | Resolved via `in_datasets_search` (2023 state/UT IPC) |
| `in_crime_sll_by_state` | `8d963bec-c368-4677-9875-7832411a91bd` | Newest stable **state/UT** SLL matrix found (2021) |
| `in_crime_against_women` | `fee6c4c1-0c08-4527-9887-16567ec56a7f` | 2023 state/UT IPC+SLL against women |

### Power / renewable (5)

| Tool | Resource ID |
|---|---|
| `in_renewable_energy_share` | `a4e68e15-5c2e-4aa4-b884-e7f85fc8767c` |
| `in_renewable_capacity_state` | `7ae606e1-58b0-4b62-b268-03f4d8d3ce09` |
| `in_solar_parks` | `41653fa6-641f-476a-a6e3-974a201cf53c` |
| `in_power_supply_position` | `9056ba91-141c-455e-935b-0e424369c638` |
| `in_thermal_coal_statement` | `558fcf41-7ec8-46b0-a2c6-2712bc3808ae` |

### Water (5)

| Tool | Resource ID |
|---|---|
| `in_surface_water_quality` | `19697d76-442e-4d76-aeae-13f8a17c91e1` |
| `in_jal_jeevan_habitation` | `a7d77b40-59c7-4157-b29b-e114f7ec6c01` |
| `in_reservoir_level` | `1fc2148c-fc41-46f5-a364-bdc03f77053f` |
| `in_water_supply_surat` | `d7d15ec2-7853-4932-b854-d65ed7abaf65` |
| `in_water_charges_surat` | `dec710f2-7ee6-45cd-916f-da58f108fb2a` |

### Education — AISHE (3)

| Tool | Resource ID |
|---|---|
| `in_aishe_foreign_students` | `fb4fe7e8-9d01-47bd-b8bc-f00f0c0239ff` |
| `in_aishe_enrolment_category` | `749ac757-71e5-4d45-bd8a-2f3478b420fd` |
| `in_aishe_passout_by_state` | `975b872a-68b9-4daf-aac1-c6b7964c1804` |

### Agriculture & petroleum products (3)

| Tool | Resource ID |
|---|---|
| `in_onion_production` | `8ba0d98c-0fd0-49e2-b5f0-556c72b65d43` |
| `in_crop_insurance` | `f6fb3ade-c752-4234-b8be-eee7b1578bea` |
| `in_petroleum_products` | `8b75d7c2-814b-4eb2-9698-c96d69e5f128` |

### Petroleum / steel / CGHS / HMIS / cyclone / forest / inflation (18)

| Tool | Resource ID |
|---|---|
| `in_crude_oil_production` | `7932c3ed-c88d-4e0c-bc39-17e3e3170483` |
| `in_crude_oil_processed` | `8d3b6596-b09e-4077-aebf-425193185a5b` |
| `in_petroleum_trade` | `518e560e-7fa7-4f5b-8aed-3b90323ed965` |
| `in_steel_production` | `829137af-5e90-4400-bffe-5d65b66e5956` |
| `in_cghs_wellness_beneficiaries` | `f79de553-700c-4ef4-82f9-063b3ab5dfca` |
| `in_cghs_hospitals` | `de59e770-2333-4eaf-9088-a3643de040c8` |
| `in_cghs_diagnostics` | `34e827e1-03e0-4193-a0e7-1fcc62e306b5` |
| `in_cghs_dispensaries` | `f55f64f0-3511-475a-9975-82485150933b` |
| `in_hmis_facility_performance` | `d802b650-78a5-485c-89a9-5ad45a47938a` |
| `in_cyclone_frequency` | `d3c39de0-35d6-4e80-83de-bd101fd2e13e` |
| `in_cyclone_shelters` | `89e449ee-6820-4503-8f42-960711cdfcaa` |
| `in_cyclone_damages` | `a89e88bd-9b15-441b-aa6f-80e253d3997c` |
| `in_forest_cover_india` | `ee07a310-7680-4ad3-9175-57e6033d2683` |
| `in_forest_cover_maharashtra` | `84d26d02-935b-479c-9427-c27ee1afd76f` |
| `in_forest_cover_karnataka` | `dc39ada1-aa0f-4885-8490-21d242cfacc3` |
| `in_wpi_inflation` | `5bd65ce0-13b2-477e-a490-9dd0a1b5fc74` |
| `in_food_inflation_cfpi` | `e651fa87-53ff-4b80-9c43-67aabb0b209a` |
| `in_cpi_food_by_state` | `0e35257e-4f73-4708-b624-24f1d9fe942a` |

**Subtotal already covered: 118**

---

## 2. Skipped (4)

See [`SKIPPED_TOOLS.md`](./SKIPPED_TOOLS.md).

| # | Tool | Reason |
|---|---|---|
| 22 | `in_approved_hotel_projects` | Catalog resource empty |
| 95 | `in_nager_holidays` | Nager.Date returns 204 for `IN` |
| 96 | `in_delhi_bus_stops` | No free unauthenticated static GTFS URL |
| 97 | `in_mumbai_bus_stops` | No confirmed free static GTFS/CSV |

---

## Implementation notes

1. Fixed data.gov.in tools live in `src/resource-catalog.ts` and register via `registerResourceTools` (same `queryDataGovResource` + meta/result shape as `in_mandi_prices`).
2. Each planned resource was smoke-tested with `limit=5` before coding (`scripts/verify-resources.mjs`).
3. NCRB tools (#56–58) locked resource IDs via `in_datasets_search` at implementation time (documented above).
4. `#96` / `#97` skipped — no free public static feed URL confirmed without auth/payment.
5. Update this file when a planned tool ships or is skipped.
