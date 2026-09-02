# BANNON — UNREAL VERSION MIGRATION DECISION

**RECOMMENDATION: target UE 5.8. Migrate Bannon 5.3 → 5.8 and take the Lyra
foundation from the Owner's own fork.**

Measured, not preferred. The evidence and the risks are both below.

---

## The three versions in play

| Layer | Version | Source |
| --- | --- | --- |
| Lyra source | **5.8.0** | `mhvnsnt/UnrealEngine` @ `7deeb413`, `Engine/Build/Build.version` |
| Lyra content | **5.0** | `anti-hero-game-studio/LyraStarterGame_FPS` @ `af1c7af8` |
| Bannon | **5.3** | `unreal/Bannon.uproject`, `EngineAssociation` |

---

## FINDING 1 — Bannon's migration cost is LOW, and this is the decisive measurement

Bannon's `Build.cs` files declare version-fragile dependencies. Its **code does
not use them**:

| Symbol | Files referencing | Declared in `Build.cs`? |
| --- | ---: | --- |
| `UControlRig` | **0** | yes (`ControlRig`) |
| `FRigVM` | **0** | yes (`RigVM`) |
| `FChaosScene` | **0** | yes (`Chaos`, `ChaosCore`) |
| `FGameplayTag` | 0 | no |
| `FBodyInstance` | 1 | via `PhysicsCore` |
| `UPhysicsAsset` | 1 | — |
| `UPrimaryDataAsset` | 4 | — |
| `UAnimInstance` | 7 | via `AnimGraphRuntime` |
| `FTransform` | 13 | — |
| `USkeletalMeshComponent` | **53** | — |

The API surface Bannon actually touches is `USkeletalMeshComponent`,
`FTransform`, `UAnimInstance` and `UPrimaryDataAsset` — the most stable classes
in Unreal, essentially unchanged across 5.x. **Control Rig and RigVM, the APIs
that genuinely churn between versions, are declared and never called.**

The `native/` combat laws are header-only C++ with no Unreal types at all, so
they are version-independent by construction.

**Bannon is not a 5.3 codebase in any deep sense. It is a shallow, stable-API
codebase that happens to declare 5.3.**

## FINDING 2 — a 5.3 Lyra is not available from the Owner's fork

```
branches in mhvnsnt/UnrealEngine ....... release   (only)
tags in mhvnsnt/UnrealEngine ........... none
```

Path A (keep Bannon at 5.3) therefore cannot be served by the Owner's own
repository. It would require sourcing a 5.3-era Lyra from a third party, adding
an acquisition dependency that Path B does not have.

## FINDING 3 — content migrates forward, never backward

`.uasset` upgrades on open in a newer editor. It does **not** downgrade. The
content is 5.0, so:

- 5.0 → 5.8 is a supported (if large) upgrade.
- 5.0 → 5.3 is also an upgrade, and smaller.
- Any content authored at 5.8 could never be opened at 5.3.

Content direction favours "as new as you intend to ever go", because every asset
touched at the target version is locked to it.

## FINDING 4 — ContextualAnimation exists only at 5.8

| Plugin | 5.8 Lyra | 5.0 Lyra | Bannon 5.3 declares |
| --- | --- | --- | --- |
| `ContextualAnimation` | **enabled** | no | no |
| `MotionWarping` | no | **enabled** | no |
| `ControlRig` | content-level | content-level | **yes** |
| `FullBodyIK` | no | no | **yes** |

Bannon already declares `ControlRig` and `FullBodyIK` — the IK stack Lyra's
`.uproject` does not. Bannon is not starting from zero on rigs; it is starting
from zero on *player lifecycle*, which is the opposite of what the Lyra plan
assumed.

`ContextualAnimation` is Epic's synchronised two-actor interaction system and is
the strongest single technical argument in this decision: it is the closest thing
in the engine to what `BannonGrappleComponent` does by hand, and it is 5.8-only.

## FINDING 5 — Android

```
[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]
bSupportsVulkan=True
MinSDKVersion=28
TargetSDKVersion=33
```

Four lines. Vulkan is already on, which is what newer UE versions want. This is
config, not architecture, and does not meaningfully weight the decision.
**Unverified:** whether UE 5.8 raises the minimum Android SDK above 28 — that
must be read off the chosen engine, not assumed.

---

## The paths

| | **Path A** — Bannon stays 5.3 | **Path B (RECOMMENDED)** — Bannon → 5.8 | **Path C** — both to newest |
| --- | --- | --- | --- |
| Lyra source | third-party 5.3 needed; **Owner's fork cannot supply it** | **direct from Owner's fork** | same as B |
| Lyra content | 5.0 → 5.3 upgrade | 5.0 → 5.8 upgrade (larger) | same as B |
| Bannon C++ cost | none | **low** — fragile APIs unused (Finding 1) | low |
| `ContextualAnimation` | **unavailable** | **available** | available |
| Acquisition risk | new third-party dependency | none | none |
| Ceiling | frozen at 5.3 | current | current |

Path C is Path B; there is no third engine to go to. They are listed separately
only because the directive asked for three.

## Recommendation

**Path B. Target UE 5.8.**

1. Migration cost is measured low — the churning APIs are unused (Finding 1).
2. The Owner's own fork supplies the source directly; Path A needs a third-party acquisition that does not currently exist (Finding 2).
3. Content only moves forward, so choosing the newest intended target once avoids a second migration later (Finding 3).
4. `ContextualAnimation` is 5.8-only and is the best available foundation for two-actor grapples (Finding 4).
5. Android is four lines of config (Finding 5).

## Risks, stated rather than buried

- **5.0 → 5.8 is a large content jump.** Some assets will need re-save or fixup; a few may not survive. This is the largest real cost in Path B and it lands on content, not code.
- **UE 5.8 Android minimums are unread.** If 5.8 requires above `MinSDKVersion=28`, that is a device-support decision the Owner must make.
- **Nothing here is compiled.** Finding 1 says the migration *should* be cheap because the fragile APIs are unused. Only a real build proves it.
- **The 5.8 Lyra has no content**, so Path B still needs a 5.8-compatible content baseline, or the 5.0 content upgraded. That work exists in every path.

## Verification state

`STRUCTURALLY_VERIFIED`. Every number above is read from repository metadata,
`.uproject` files, `Build.cs` files and symbol counts across `unreal/Source`.
Nothing has been compiled and no migration has been performed.
