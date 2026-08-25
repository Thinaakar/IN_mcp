# Skipped tools

Tools that failed resource verification (empty, 404, auth, or non-free feed).

| # | Tool | Resource / source | Reason | Checked |
|---|---|---|---|---|
| 22 | `in_approved_hotel_projects` | Catalog `e0e51bee-d555-4f1e-ac46-3be60689fc62` | API returned HTTP 200 with **empty records** (`total: 0`) | 2026-08-21 |
| 95 | `in_nager_holidays` | Nager.Date `GET /api/v3/PublicHolidays/{year}/IN` | Returns **204** with empty body (India not supported). Use existing `in_holidays` (Tallyfy) instead | 2026-08-21 |
| 96 | `in_delhi_bus_stops` | Open Transit Data Delhi (`otd.delhi.gov.in`) | Static GTFS download requires purpose/terms form; no confirmed free unauthenticated direct CSV/GTFS URL | 2026-08-21 |
| 97 | `in_mumbai_bus_stops` | BEST / Mumbai GTFS | No confirmed free public static GTFS/CSV URL without payment or auth | 2026-08-21 |
| 98 | `ar_*` / `ga_*` / `jh_*` / `mn_*` / `tr_*` domain tools | State-department data.gov.in resources | Search found only Rajya Sabha / national tables, not a verified state-org resource that returns rows. Keep `{code}_open_data` | 2026-08-25 |
| 99 | `tn_tangedco` | TANGEDCO | No queryable exclusive resource ID verified; use `tn_open_data` then `in_dataset_query` | 2026-08-25 |
| 100 | `ap_meebhoomi` | Meebhoomi land records | No queryable exclusive resource ID verified; use `ap_open_data` | 2026-08-25 |
| 101 | `ka_bhoomi` | Bhoomi land records | No queryable exclusive resource ID verified; use `ka_open_data` | 2026-08-25 |
