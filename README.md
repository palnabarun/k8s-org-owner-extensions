# GitHub Kubernetes Owner Checker

A browser extension (Chrome and Firefox) that checks if a GitHub user is listed as an owner in Kubernetes organization OWNERS files and displays the result as a banner on their GitHub profile page.

## Features

- **Automatic Detection**: Works on any GitHub profile page (e.g., `github.com/username`)
- **Official Kubernetes Data**: Uses the cs.k8s.io API to search OWNERS files across Kubernetes repositories
- **Visual Banner**: Shows results with different colors and icons based on ownership status
- **Direct Links**: Provides links to view the actual search results on cs.k8s.io
- **Dark Mode Support**: Works with both light and dark GitHub themes
- **Loading States**: Shows progress while checking ownership

## Repository Layout

```
shared/              # source of truth: content.js, background.js, styles.css
chrome/manifest.json # Chrome MV3 manifest
firefox/manifest.json# Firefox MV3 manifest (browser_specific_settings.gecko.id set)
scripts/build.sh     # copies shared/* into each browser dir, zips to dist/
.github/workflows/release.yml  # tag push -> built artifacts attached to GitHub Release
```

`content.js`, `background.js`, and `styles.css` live only in `shared/`. The build script copies them into `chrome/` and `firefox/` at package time; those copies are gitignored.

## Build

```sh
bash scripts/build.sh
```

Outputs to `dist/`:

- `dist/chrome.zip` — load unpacked or upload to Chrome Web Store
- `dist/firefox.zip` — same payload, for self-hosting or store upload
- `dist/firefox.xpi` — renamed zip, drag-and-drop installable in Firefox (when unsigned installs are allowed)

Build script also prints SHA-256 of each artifact.

## Install (Chrome)

1. Run `bash scripts/build.sh`.
2. Open `chrome://extensions`.
3. Toggle **Developer mode** (top right).
4. Click **Load unpacked**, select the `chrome/` directory.

Or install from a built zip:

1. Drag `dist/chrome.zip` onto `chrome://extensions` with Developer mode on.

## Install (Firefox)

### Temporary (for development)

1. Run `bash scripts/build.sh`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**, select `firefox/manifest.json`.

### Permanent (unsigned)

1. Open `about:config`, set `xpinstall.signatures.required` to `false`. **Warning:** reduces security; only do this on a development browser.
2. Open `about:addons`, gear icon, **Install Add-on From File...**, pick `dist/firefox.xpi`.

For Mozilla AMO signing, run `web-ext sign` against `dist/firefox.zip` with your API credentials (not wired into the build script).

## Releases

Push a tag matching `v*` (e.g. `v0.1.0`). The `release.yml` workflow runs `scripts/build.sh` and attaches `chrome.zip`, `firefox.zip`, and `firefox.xpi` to an auto-generated GitHub Release.

Keep the manifest `version` field in `chrome/manifest.json` and `firefox/manifest.json` in sync with the tag yourself before pushing.

## Usage

1. Navigate to any GitHub user profile (`https://github.com/<username>`).
2. The extension runs automatically and shows a banner at the top of the profile:
   - **Owner**: Green banner — user is listed in OWNERS files
   - **Not Owner**: Blue banner — user not found
   - **Loading**: Yellow banner while checking
   - **Error**: Red banner on API failure
3. Click **View details** / **Search manually** to open the cs.k8s.io search results.

## How It Works

The extension:
1. Detects when you're viewing a GitHub profile page
2. Extracts the username from the URL
3. Queries the cs.k8s.io API to search for the username in OWNERS files across Kubernetes repositories (vendor directories excluded)
4. Displays the results in a banner with appropriate styling and links

## Permissions

- `https://github.com/*` — content script injection on GitHub
- `https://cs.k8s.io/*` — fetch search API from background/content

In MV3 these are declared under `host_permissions`.

## Troubleshooting

### Banner not appearing
- Confirm you're on a profile page (`github.com/<username>`), not a repo/org/settings page
- Wait a moment for SPA navigation to settle
- Check the browser console for errors

### API errors
- Check connectivity
- cs.k8s.io may be temporarily unavailable; reload the page to retry

### Chrome: "Service worker registration failed"
- Make sure you ran `bash scripts/build.sh` so `chrome/background.js` exists

## License

Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See [LICENSE](LICENSE) for full terms.
