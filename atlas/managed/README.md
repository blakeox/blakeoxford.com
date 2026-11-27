# Latin America Election Atlas: managed Cloudflare deployment

The Atlas runs at https://atlas.blakeoxford.com on the `blakeoxford-voting-atlas` Worker. Cloudflare Workers Static Assets serves the 23-country map, HTML, fonts, and public datasets directly from the deployed Worker version. The only custom runtime routes are `/mcp` (the maintained Cloudflare Agents SDK handler) and a compatibility redirect from `/index.html` to `/argentina`. The MCP handler reads the same versioned public datasets through the native `ASSETS` binding. No production R2 binding, hand-maintained upload manifest, custom gzip negotiation, or custom ETag code is needed. The old private bucket remains as a rollback dependency only. Do not delete it while keeping the R2 release as a rollback.

## Build and verify

Run from the `atlas-cloudflare` directory with Node 22.18+ and Python 3:

```sh
npm ci
npm test
npm run deploy
npm run test:live
```

`npm test` creates the versionable output with Cloudflare's official CLI and Vite integration, then runs the protocol and route suite against the local Cloudflare runtime. Deploy only with the correct Cloudflare account authenticated. To rebuild without testing, use `npm run build`; to run the checked site locally after building, use `npm run dev`. Deployment does not provision additional infrastructure, enable workers.dev, or enable public preview URLs. Keep the compatibility date and dependency lock pinned and test releases before shipping upgrades.

The build assembles the committed publication snapshots from `styled/` and `latam-ui/output/`, overlays the Atlas Connect page, and lets Cloudflare upload and version the result. Election and demographic source notes are public on the site. New data still needs provenance and validation: do not automate unreviewed merges of official returns, reference geometry, or incompatible denominators.

## Homepage and country profiles

The home page at `/` is the editorial entry point built by `home.py`, while `/regional` is the canonical map workspace. Legacy home URLs with map filters or known map anchors redirect in the browser. Home uses the same Natural Earth outlines, election archive, and portfolio theme as the map. Run `python managed/test-home.py <origin>` to check navigation and old bookmarks. The UX review is in `managed/HOME-UX-REVIEW.md`.

`/countries` is the country directory, with permanent three-letter routes such as `/countries/arg`. Country profiles are built by `managed/countries` from the Atlas archive, including historical trends, presidential round details, legislative constituency coverage, and country context where available. Argentina keeps its separate 2023 provincial and voting-circuit tools. No pages imply unsupported coverage.

## Regional map explorer

The live map workspace source is `latam-ui/explorer/regional.{html,css,js}`. The production builder copies the JS and CSS to versioned URLs; bump the suffix in the HTML and builder when shipping incompatible changes. The separate `latam-ui/output` pipeline continues to provide the unchanged election, context, and geographic datasets. Run `python managed/test-regional.py <origin>` for the browser smoke test with the same Playwright setup as the navigation test.

## Recent elections

`/elections` is a static index of every presidential and lower-house record since 2020 in the existing regional elections dataset. `recent.py` generates it at build time from the same dataset as the map and MCP, so updates to that dataset appear in the index without separate editing. Unknown election dates are shown as year-only. It is an archive index, not a live election feed.

## Navigation

On phones the header keeps direct Map, Countries and Recent elections links visible. Countries has a progressive-enhancement name filter (all 23 links remain available without JavaScript). The regional map uses real SVG links to country profiles; “Highlight on map” is a separate analysis control. Each profile links back to all countries and to a highlighted map view. Run `python managed/test-wayfinding.py <origin>` to verify the round-trip, including keyboard interaction.

Edit `navigation.py` to update destinations and labels on every Atlas page. `prepare.py` renders the shared header at build time; the menu uses native HTML disclosures, with a small script for the mobile toggle and Escape behavior. Colors and typography use the same theme tokens as the rest of the Atlas. The portfolio links are in the footer.

To run the optional browser check, install Python Playwright and Chromium and start the local Cloudflare runtime on port 8278. Run `python managed/test-navigation.py` from the project root, or pass the live origin to check production. Set `CHROMIUM_BIN` only to use a non-default Chromium binary.

## Rollback

Use Workers & Pages → blakeoxford-voting-atlas → Deployments to roll back to the immediately previous verified version. Production URLs stay the same. The prior R2 release is version `db5e7b26-c8ae-4c94-94de-6c8b11e513f7` and remains deployable without DNS changes.
