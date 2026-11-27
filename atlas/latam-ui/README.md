# Latin America Atlas UI patch

This release layer expands the regional landing page from 19 to 23 selectable countries. The existing Argentina and South America detail pages retain their scope, data and URL routes. The only edits to those pages are shared navigation and masthead/footer branding copy.

## Build

```sh
python atlas-cloudflare/latam-ui/build.py
node --check atlas-cloudflare/latam-ui/output/regional.js
```

Default inputs are the **unmodified 19-country** `atlas-cloudflare/styled/` base, `argentina-election/raw/ne-countries.geojson` (Natural Earth 1:50m), and `atlas-cloudflare/latam-data/` country data. `--base`, `--data`, `--geography` and `--output` override these paths. Output is a ten-file patch (the five HTML pages, regional JS/CSS, and three merged JSON files). Do not write output over styled; overlay the patch during release staging. MCP's `prepare.py` owns the Connect AI link and documentation shell. The existing `<header><p class="eyebrow">Election atlas` shell marker is unchanged.

## Contracts

`votes-extra.json` contains exactly the four ISO keys `MEX`, `CUB`, `DOM`, `HTI`, using the existing regional election schema:
- Country object: `{name, region, blocs, leg, pres, note?, url?}`. Use region `Mexico` for MEX and `Caribbean` for the other three. Missing series are arrays, never synthetic observations.
- Presidential object: `{year, date, runDate, first, run, src, note?, url?}`, with existing four-element candidate rows `[name, ballotLabel, percent, votes]`. Source links are for HTTPS only.
- Legislative object: `{id, year, month, areas, parties, omitted, src?, url?}`. New areas have no mapped boundary; `area[4]` is null or absent until separately audited. District tables remain usable.
- Blocs keep the existing historical source schema and cutoff, with no inferred classifications.

`context-extra.json` is keyed by the same ISO codes, with World Bank indicator IDs for 2023 fields. Omitted fields or nulls stay missing. Country context facts are not voting facts.

No changes are made to the original historical election returns or ADM1 shape indices. Country outline projection matches the earlier regional map, with geometry-derived bounds and explicit zoom for each group. Other places drawn in neutral gray are map context, not included comparison countries. Regions in shareable URLs: `south`, `central`, `mexico`, `caribbean`, and `all`. The UI labels Caribbean as **Selected Caribbean**, not all of the Caribbean or a strict linguistic definition of Latin America; Belize remains in Central America.

## Smoke tests

Run `node atlas-cloudflare/latam-ui/logic-test.cjs` to validate all 23 map hits and key drilldowns without browser dependencies.

Use a complete directory (base assets plus this patch) served over HTTP; the preview server must route `/` to regional.html, as production does. Run `node atlas-cloudflare/latam-ui/smoke.cjs <origin>` with Playwright and its Chromium installed (override with `CHROMIUM_BIN` if needed). The smoke test covers desktop and phone-sized widths, all regions, Mexico's table-only legislative results, latest national result links, and missing Cuba presidential data.
