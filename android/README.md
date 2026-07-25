# BANNON Android — WebView APK (the "download an APK and install it" path)

This is a real, installable Android app that wraps the BANNON web game. It's the path that gets you a
`.apk` **without** an Unreal build (the native UE APK is separate, heavier, and needs a playable UE
level — see `docs/MOBILE_INSTALL.md`). This one you can build in CI today.

## What it is
- `MainActivity` = a fullscreen, landscape, immersive WebView with JS + DOM storage + WebGL on.
- The game (`BANNON_v150.html`) is **bundled into the app assets** at build time and loaded locally
  (`file:///android_asset/index.html`), so it launches instantly and saves persist under one stable app
  origin. The AAA fighter models **stream from the GitHub raw CDN** on demand (INTERNET permission).
- Launcher icon = the generated BANNON fire "B".

## How YOU get the APK (no computer, no UE)
1. On GitHub, go to **Actions → "Build Android APK (WebView game)" → Run workflow** (or it runs on a push
   to `android/**` / the HTML on `main`).
2. When it finishes, open the run and download the **`BANNON-debug-apk`** artifact — you can do this
   **on your phone's browser**.
3. Unzip → tap the `.apk` → Android asks to allow "install unknown apps" for your browser/files app →
   allow once → **Install** → open. It's a real app on your home screen.

## Notes
- The APK is **debug-signed** (fine for sideloading/testing). For a Play Store upload we'd wire a release
  keystore later.
- No Gradle wrapper jar is committed (it's a binary); CI provides Gradle via `gradle/actions/setup-gradle`
  and runs `gradle -p android assembleDebug`. To build locally, install Gradle 8.x + the Android SDK and
  run the same command (first copy `BANNON_v150.html` → `android/app/src/main/assets/index.html`).
- This is a stopgap-that-ships: a genuine native app around the real game today, while the UE C++ build
  matures behind it.
