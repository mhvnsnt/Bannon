# Playing BANNON — website, app, APK (and why downloading the HTML loses things)

## Why the downloaded HTML "doesn't keep everything"
The game is one HTML file that pulls three.js from a CDN and streams models from the repo. When you
**download** it and open the file:
- **Saves don't persist.** localStorage (your CAW characters, DNA payloads, equipped movesets,
  chosen models, God-Mode orders) is keyed to the page's *origin*. A downloaded `file://…/BANNON.html`
  gets a fresh, path-specific origin — so a save made one session isn't visible the next, and never
  travels between your phone and desktop.
- **No `assets/` folder beside it.** The models live at `assets/models/*.glb` in the repo. A lone
  downloaded HTML has no such folder, so it falls back to streaming them from the repo CDN (works
  with internet, but slow for the current ~80 MB models — decimation, queued, makes this fast).
- **Server features are off.** The daemon/generation endpoints need the backend running.

**The fix is to HOST it at one stable URL.** Then it's a single origin (saves persist and sync),
assets resolve, and it's just a link you open — no download.

## Option 1 — Website (live now, once merged to main)
`.github/workflows/pages.yml` publishes the game to **GitHub Pages** on every push to `main` that
touches the HTML: `https://mhvnsnt.github.io/Bannon/`. It serves `BANNON_v150.html` as `index.html`;
three.js loads from its CDN, models stream via the in-engine CDN fallback (raw.githubusercontent →
`main`). To turn it on once: repo **Settings → Pages → Source = GitHub Actions** (one click), then the
workflow deploys automatically. Visit the URL on phone or desktop — same saves both places.

## Option 2 — APK (Android)
The repo already has an Android WebView shell (`app/`, from the God-Mode drop). The lightweight path:
point its WebView at the Pages URL above → an installable APK that loads the always-current game.
The heavyweight path is the **native UE5 build** (`unreal/`) packaged to Android — a real APK with
Chaos physics, not a WebView. That's the endgame the `unreal/` port is building toward.

## Option 3 — Native app (UE5)
`unreal/Bannon.uproject` packages to Windows/Mac/Android/iOS from the UE editor (needs the engine
built — see `unreal/README.md`). This is the "full app" with everything running natively; the port
status is tracked in `unreal/CONVERSION.md`.

## Making hosting fast (the one dependency)
The current owner models are ~80 MB each (≈1 M verts). That's heavy for a phone and for CDN streaming.
The queued **decimation pass** (skin-weight-preserving, ~40–60k tris) drops them to a few MB each —
which makes the website load instantly and the APK small. It's the same fix that helps phone perf.
