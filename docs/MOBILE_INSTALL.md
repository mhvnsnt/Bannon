# Getting BANNON onto your Android — the honest, exact paths

You asked: *how do I go from GitHub repo → download the zip on my phone → it being fully installed with
all files rendering and working in C++ UE on mobile Android?* Here is the straight answer, because one
part of that chain is a real dead end and I don't want you chasing it.

## ⛔ The one thing that does NOT work: "download the zip → installed UE game"
A GitHub zip of the `unreal/` project is **C++ source code**, not an app. A phone cannot compile Unreal
Engine C++ — UE has to be **built and packaged into an `.apk` on a computer** (or in CI) that has the
engine + Android SDK/NDK installed. So "download the repo zip on my phone and it runs in UE" is not a
thing for ANY UE game, ours included. There are two real ways to actually play on your Android, below.

## ✅ PATH A — Play NOW as an installable app (the web/PWA build) — no computer needed
This is live today and needs nothing but your phone. It's the whole game (all files render; models
stream from the repo CDN).
1. Get it hosted once (one-time, see `docs/DEPLOY.md`): merge this branch to `main`, then repo
   **Settings → Pages → Source = GitHub Actions**. That publishes `https://mhvnsnt.github.io/Bannon/`.
2. On your Android, open that URL in **Chrome**.
3. Chrome menu (⋮) → **Add to Home screen** / **Install app** → tap **Install**.
4. It lands on your home screen with the BANNON icon. Open it → **fullscreen, landscape, no browser
   bar** — it looks and behaves like a native app. Saves persist (one origin), touch controls are on.
This is the "real Android app" experience without an APK. It is what I'd use to test visually right now.

## ✅ PATH B — A true native `.apk` (the C++ UE build) — needs a build step, then you sideload
When the UE port is far enough to package, the flow is:
1. **Build the APK** (on a computer with UE 5.8 + Android Studio SDK/NDK, or via CI — see below). In the
   UE Editor: *Platforms → Android → Package Project* produces `Bannon-Android.apk` (+ an `.obb` for big
   assets). You do NOT do this on the phone.
2. **Get the APK onto your phone**: download it from the CI build's artifacts (or transfer it), then tap
   it. Android will ask to allow "install unknown apps" for your browser/files app → allow it once.
3. **Install + open** → a real native app with Chaos physics, the C++ combat, the active ragdoll.
### Building the APK without your own PC — GitHub Actions
UE can package Android in CI. It's heavy (the runner needs the engine + Android NDK), but it means you'd
just **download the finished `.apk` from the Actions run on your phone** and install it — exactly the
"zip on my phone → installed" experience, except it's a built APK, not source. This CI workflow is
**not set up yet** (the UE port isn't package-ready — it's C++ systems, no cooked content/levels). It's
tracked as a next step once the port has a playable level. I'll scaffold `.github/workflows/android.yml`
when we're there.

## So, today vs. later
| Want | Do this | Status |
|------|---------|--------|
| Play on Android right now, app-like | PATH A (PWA install) | **ready** once hosted |
| Native C++ UE app with Chaos physics | PATH B (packaged APK) | after the UE port has a playable level + CI |

## Why the web build "loses things" if you just download the HTML (recap)
Opening a downloaded `file://…BANNON.html` gives a fresh origin every time, so saves don't persist and
there's no `assets/` folder beside it. **Hosting it once (Path A) fixes all of that** — that's the whole
point of the PWA setup. Don't download the HTML; install the hosted URL.
