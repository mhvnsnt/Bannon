# M. ENGINE — WHAT IS ACTUALLY THERE (mapped 2026-09-04)

Owner: *"attach/map M. Engine. Then we can run the leg work as an isolated worker job instead of
continuing to grow Bannon's debugging surface manually."* — and then: *"m engine is a repo u are
being given permission to pull into Bannon from my GitHub."*

**MAP ONLY. Nothing was rearchitected, nothing was copied into Bannon.** This is the survey the
owner asked for before any actuator layer gets designed on top of work that already exists.

`mhvnsnt/m.-engine-` — public, cloned read-only at `7fd2f72`, **678 files / 21 MB**.
Note the casing: the session git proxy serves **lowercase** repo names (already banked law — the
capitalised form 404s and reads exactly like a permissions failure).

## MAPPED FROM CODE, NOT FROM THE README

M. Engine ships 64 markdown ledgers (`CAPABILITY_LEDGER`, `M_ENGINE_COMPLETENESS_MATRIX`,
`OPEN_SOURCE_FEDERATION_MATRIX`, …). OWNER LAW is that metadata is a hint, never an authority, so
everything below was read out of source or **executed**, and the docs were checked afterwards for
divergence. There was none worth reporting — this repo is unusually honest about its own gaps.

    374 .kt   an Android app + a Kotlin cloud control plane
    126 .py   build/repair scripts (mostly scripts/archive)
     64 .md   ledgers and mission evidence
     13 .js   the worker + firebase functions
      7 .jsx  the web front end

## THE FOUR REAL SUBSYSTEMS

### 1. `tools/unreal-worker/` — 234-line server, 221-line probe, zero dependencies
This is the piece the federation search found months ago and it is genuinely good. Its own header
states the constraints, and the code keeps them:
* **NO arbitrary shell execution.** Operations are a named allowlist — `probe`, `build`,
  `automationTest`, `inspectContent`. There is no endpoint that takes a command string. Its comment:
  *"A worker that accepts arbitrary commands is a remote shell with extra steps."*
* **Paths confined to configured project roots**; traversal is REFUSED, not sanitised.
* **Every operation returns evidence including on failure** — the build op returns the last 40 KB of
  stdout AND stderr either way. *"Failure is data, not an exception to hide."*
* **Capabilities are PROBED, never configured.** *"'Unreal is installed' according to a config file
  is not evidence."* That is the same law this repo runs on, written independently.
* Bearer token with a **constant-time compare**; `/health` deliberately unauthenticated so the
  fabric can discover the worker without it revealing anything.

### 2. `cloud_control_plane/` — Kotlin/Ktor, ~870 lines
`ControlPlaneServer.kt` exposes a real route surface: ledger sync/events, mindstream, opportunities,
capabilities (+ `/verify`, `/reality_sweep`, `/transitions`, `/toggle`), active cycles + cancel,
worker cancel, telemetry, tandem, development signals, and **`/api/v1/worker/enroll` +
`/worker/heartbeat`** — i.e. worker enrolment already exists. Backed by `AgencyLedgerRepository`
with both `SQLiteLedgerRepository` and `PostgresLedgerRepository` implementations.

### 3. `shared-control-plane/openapi.yaml` — the declared contract
39 lines, four paths: `POST /missions`, `GET /missions/{id}/status`, **`POST /workers/dispatch`**
("Dispatch task to a Remote Worker (e.g. SWE-agent, OpenHands)"), `POST /device/command`
(ADB/UIAutomator). Smaller than the Kotlin server's actual route list — the OpenAPI is the intended
public contract, not a description of everything implemented.

### 4. `m-engine-web/` — React/Vite PWA front end (24 files)

## WHAT I RAN, NOT WHAT I READ

The worker's probe is zero-dependency Node, so it runs in this container unmodified. Executed
against `/home/user/Bannon`:

    UNREAL_PROJECT_AVAILABLE     VERIFIED         1 .uproject file(s) found
    UNREAL_RUNTIME_DISCOVERED    CAPABILITY_GAP   no UnrealEditor-Cmd binary found
    UNREAL_BUILD_CAPABLE         CAPABILITY_GAP   no engine root; build tool cannot exist
    ANDROID_TOOLCHAIN_AVAILABLE  CAPABILITY_GAP   missing Android SDK / NDK
    PHYSICAL_DEVICE_AVAILABLE    CAPABILITY_GAP   adb not available

## THE FINDING THAT DECIDES THE UE/LYRA PLAN

`inspectContent` exists because of a specific Bannon claim. Its own comment:
*"an Unreal project with no .uasset and no .umap has no animation system to debug."*
Run against this repository:

    unreal/Bannon.uproject     exists
      .uasset   0
      .umap     0
      .uplugin  0
      .cpp/.h   706
      .fbx      202   (source art, outside the UE content tree)

**706 source files and ZERO content assets.** No maps, no assets, no plugins. So the UE side is not
a game that renders badly — there is nothing there to render yet. M. Engine already knows this and
says so in its own words: Unreal execution is `IMPLEMENTED_UNVERIFIED` *"pending physical
workstation enrollment"*.

## THEREFORE — CAN THE LEG WORK BE A WORKER JOB TODAY? NO, AND FOR TWO REASONS

1. This container has **no Unreal Engine**, so the worker's `build` and `automationTest` return
   `CAPABILITY_GAP` by design. The worker needs a host that actually has UE installed.
2. More fundamentally, **the leg work is not an Unreal job at all.** The marionette/locomotion
   defects measured so far (walk contention 3191 → 464, clip authority, cadence) are all in
   `BANNON_v150.html` — the Three.js build, which runs in this container fine and is where the
   owner's phone actually plays. Dispatching it to the Unreal worker would send it to a runtime
   that holds none of the code under test.

**The unreal-worker is the right tool for the UE/Lyra path and the wrong tool for today's
locomotion work.** Saying so now is cheaper than discovering it after building an actuator layer.

## THE LYRA STRATEGY ALREADY EXISTS — `workspace/BANNON_LYRA_BASELINE_STRATEGY.md`

Dated 2026-09-01, and it converges with the direction the owner and I reached independently:
Lyra as infrastructure, Bannon keeping every wrestling-specific system. Adopt directly:
PlayerController, character possession, CommonUI, **Experiences as match types**, content
organisation. Adapt: Enhanced Input, camera (wrestling needs two-target framing, not third-person
follow), Gameplay Tags, networking (Bannon's GGPO rollback overrides Lyra's prediction-based
replication).

**IT DISSENTS ON GAS, AND THE DISSENT IS RIGHT.** Marked `NOT RELEVANT`: Bannon's combat laws live
in `native/include`, are engine-agnostic and compile to BOTH web and C++. Adopting the Gameplay
Ability System for combat logic would force a rewrite into Unreal's proprietary framework and break
the cross-engine core. Anyone proposing "adopt Lyra wholesale" needs to read that row first.

Also in `workspace/`: `BANNON_UNREAL_IMPORT_MANIFEST.md`, `BANNON_ASSET_PROVENANCE.md`.

## WHAT M. ENGINE ALREADY SOLVED THAT BANNON SHOULD NOT REBUILD

* worker enrolment + heartbeat + cancel (control plane routes exist)
* an allowlisted, path-confined, evidence-returning remote operation model
* capability states as a first-class vocabulary — `VERIFIED`, `PARTIALLY_VERIFIED`,
  `IMPLEMENTED_UNVERIFIED`, `CAPABILITY_GAP`, `BLOCKED_BY_EXTERNAL_DEPENDENCY`
* a ledger with two storage backends
* `REALITY_CONTRACT.md`, which is the same law as this repo's OWNER LAW, arrived at separately:
  *"Never substitute a simulation and report it as implemented. Never claim success without
  machine-verifiable evidence."*

## HONEST GAPS AGAINST WHAT WAS ASKED FOR

The owner asked for "replit/base44-style sandbox and webview actuators". Measured against the code:
there is **no generic sandbox actuator, no browser/webview actuator, and no coding-agent dispatch
implementation** in this repo. `POST /workers/dispatch` is declared in the OpenAPI and names
SWE-agent/OpenHands, but the worker that exists is Unreal-specific. That is a real gap, and it is a
gap in the right place — the operation model to extend is already here.

NOTHING WAS COPIED INTO BANNON. This is the survey; the build list comes after the owner reads it.
