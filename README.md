# HANGAR: Gunpla collection tracker

HANGAR is a desktop app (Electron) for keeping track of a Gunpla collection: what you own, what you paid, what it's worth now and how that compares with the Japanese RRP. It also keeps a wishlist and can export a price-free, view-only web page of your collection to share, with optional one-click publishing to GitHub Pages.

Unofficial fan-made tool, not affiliated with Bandai.

## Features
- **Collection:** grid or list view, search, filter by grade, and sort by grade, name, series, price paid, value, RRP or profit/loss. Totals for models, paid, current value and P&L.
- **Item pages:** grade, scale, series, edition, quantity, notes, photo, price paid, current value, P&L and RRP comparison.
- **Add a kit by name:** type something like "HG Gundam Aerial" and what you paid. HANGAR works out the grade and scale, finds photos online and offers an RRP, and you check it all before saving.
- **RRP lookup:** finds the official Japanese maker price (tax incl.) on Bic Camera, for one kit or for every kit missing an RRP. You confirm each match. Limited, event-exclusive, Premium Bandai and gashapon items usually aren't listed.
- **Wishlist:** target prices, and **Got it!** moves a kit into the collection.
- **View mode:** the eye button in the header previews the shareable page with all prices and editing hidden.
- **View-only export:** writes a static page (no price data at all) to `view-only/`, and can publish it to a GitHub repo.
- Light and dark mode, and a phone-friendly layout for the exported page.

## Download (Windows)
Grab **HANGAR-1.0.0-portable.exe** from the [latest release](https://github.com/tijayfly/hangar-gunpla-tracker/releases/latest). There's nothing to install: put it in its own folder and run it. Windows SmartScreen may warn because the app isn't code-signed; click **More info → Run anyway**.

## Run from source
You need [Node.js](https://nodejs.org) (LTS).

```
npm install
npm start
```

On Windows you can double-click `Start HANGAR.bat` instead, which installs on first run.

To build a portable Windows .exe: `npm run dist` (output in `dist/`).

## Your data
- Running from source, everything is stored in `hangar-data/` inside this folder: `collection.json` (plus a `.bak` of the previous save) and an `images/` folder. The portable .exe keeps `hangar-data/` next to the .exe instead.
- `hangar-data/` and `view-only/` are git-ignored, so your collection, prices and any tokens never end up in this repo.
- The first launch starts you with a few **example kits** (`data/seed-collection.json`). Delete them from each kit's page, or replace the seed file with your own before first launch.

## Current values
Current values are **dummy placeholders** by default (derived from RRP or price paid), so the app is usable out of the box. There's an eBay UK option in Settings (median asking price of new Buy It Now listings) that needs your own eBay developer App ID and Cert ID; it hasn't been tested against the live eBay API yet.

## Publishing the view-only page to GitHub
1. Create a repo for the page and turn on GitHub Pages (Settings → Pages → Deploy from branch → main, root).
2. Create a fine-grained personal access token limited to that repo with **Contents: Read and write**.
3. In HANGAR: Settings → View-only page → enter `owner/repo` and the token, then **Publish now** (or tick "Also publish every time I export").

Only HANGAR's own files (index.html, data.js, app.js, match.js, styles.css, theme.js, logo.svg, .nojekyll, images/) are changed in that repo. The token is stored only in your local `hangar-data/collection.json`.

## Notes
- Photos are found with a Bing image search in a hidden window and cached locally. Use **Change photo** to pick another result, paste a URL or use your own photo. **Check photos** lists kits with no photo or a low-confidence match.
- RRP is stored in yen and converted to pounds at the rate in Settings (refreshable from frankfurter.app).
- The Bic Camera and Bing lookups depend on those sites' current layouts and may need updating if they change.

## Licence
MIT. See [LICENSE](LICENSE).
