# WWE 2K26 parity — CAW + moveset gap analysis (researched, not guessed)

Grounded in WWE 2K26's actual Creation Suite / Create-a-Moveset feature set (sources at bottom), this
is the honest list of what our CAW + moveset library is MISSING vs 2K26, and the plan to match then
surpass it (our physics + DNA + forge are the edge). Work top-down; each item is a brick.

## A. Create-A-Wrestler (Creation Suite)
2K26 shipped: separate body morphing, **two-tone hair** (2 colours + blend point + sharpness),
**60-layer decoupled attire/body layers**, **face-scan from a photo** (facial-recognition mapping),
200+ CAW slots, sliders for jawline/muscle-def/skin-tone/facial-hair/tattoos.

| feature | ours today | gap / plan |
|---|---|---|
| Body morphing (regions + axes) | ✅ BODY + AXES sliders, grouped 2K-style tabs | at parity; keep refining ranges |
| Overall body-type slider | ✅ OVERALL BUILD | ok |
| **Two-tone hair** | ✅ **SHIPPED** — `hair2` + `hairBlend`/`hairSharp`, root→tip vertex gradient, in DNA | done; add per-strand cards later |
| Face scan from photo | ⚠️ partial — forge `image→3D` seed is wired (sketch/photo → mesh); no in-CAW "scan my face → morph sliders" | add: photo → landmark map → face-slider preset (use forge/daemon vision) |
| Layered attire (60 layers) | ❌ single attireStyle + colours | build a LAYER STACK: ordered decals/pieces (logo/text/pattern/trim), each w/ colour + placement + opacity; decouple from body |
| Facial hair styles | ❌ none | beard/goatee/mustache/stubble as a face-mesh add-on set + colour |
| Skin tone / detail | ⚠️ base colour + procedural mottle | 1024px skin w/ pores+veins (MODEL FIDELITY below) |
| CAW slots / save | ✅ localStorage + DNA recipe (portable, tiny) | our DNA export beats 2K's slot cap; add cloud slots via CloudPersistence |
| Move assignment in CAW | ❌ no in-CAW moveset editor | see B |

## B. Moveset library (Create-a-Moveset)
2K26 shipped: **198 new moves**; **Signatures and Finishers as two independent meters** with
different inputs; **finishers are position-dependent**; **combo moves** (chain A→B); custom movesets
per style (brawler/high-flyer/power).

| feature | ours today | gap / plan |
|---|---|---|
| Move DB w/ categories | ✅ MOVESET_DB (STRIKE/GRAPPLE/GROUND/AERIAL…) + traj/height/power/speed | expand catalogue toward 2K depth |
| Position-dependent finishers | ✅ FINISHER_MOVES keyed by GRAPPLE_POSITIONS (front/back/…) | wire the FULL position matrix (corner/top-rope/apron/ground) |
| Signature + Finisher meters | ✅ sig→finisher BANK (MOD+jab bank, MOD+special spend) | split into TWO independent meters + inputs (2K26 model) |
| Combo / chain moves | ⚠️ `follow:"CHAIN NEXT"` flag exists on some moves | build a real chain-window system: move A opens a timed window → move B |
| Per-style movesets | ⚠️ archetype seeds stats | a CAW MOVESET EDITOR: assign moves to slots per position + per style |
| CHAR_FINISHERS → MOVESET_DB | ❌ finishers defined but not all in the library UI | wire CHAR_FINISHERS/sig into MOVESET_DB so they're selectable |
| Moveset import/share | ❌ | a moveset DNA payload (like character DNA) |

**Next moveset brick:** a **Create-a-Moveset editor** — per-position slots (standing/grapple front/
back/ground-head/ground-legs/corner/top-rope/running) each pick from MOVESET_DB filtered by position,
+ 2 signature slots + 3 finisher slots (position-tagged). Persist to the character's DNA. This is the
big "you missed the moveset library setup" item — it's the EDITOR, not the move data (we have moves).

## C. Model fidelity (make it read as a modern game — UFC / Visceral / 2K26)
From the MODEL GAP ANALYSIS (CLAUDE.md): procedural tubes have a topology ceiling; the AAA path is the
authored base GLB + DNA morphs (proven). Near-term procedural wins that most move the "modern" needle,
in priority order:
1. ~~**Real eyeball meshes**~~ ✅ SHIPPED — the flat box eyes are now vertex-painted spheres (white
   sclera + coloured iris + dark pupil on the front hemisphere, subtle emissive glow retained). Next
   polish: a cornea highlight + per-fighter iris colour driven by sp.eye (currently baked at build).
2. **1024px skin** w/ pores + veins + per-region wetness (sweat ramp already exists).
3. **Hair cards** (alpha-tex strips w/ anisotropic spec) instead of cap+cylinders; two-tone now feeds them.
4. **Elbow/knee crease rings** so joints fold instead of collapsing like a straw.
5. **Cloth wrinkle normals** on attire.
The endgame remains the authored 40–80k base male/female GLB (Blender-MCP) + FACS blendshapes, with our
DNA recipe driving morphs 1:1 (see docs/DNA_SCHEMA.md, PORT_MAP_native.md).

## Sources
- [WWE 2K26 Creation Suite Upgrades — body morphing + 60-layer attires (Operation Sports)](https://www.operationsports.com/wwe-2k26-creation-suite-upgrades-add-body-morphing-and-60-layer-attires/)
- [Custom Wrestler Creation Guide for WWE 2K26 (eslamgaming)](https://www.eslamgaming.com/2026/06/custom-wrestler-creation-guide-for-wwe-2k26.html)
- [WWE 2K26 adds 195+ new moves to Create-a-Moveset (Operation Sports)](https://www.operationsports.com/wwe-2k26-adds-over-195-new-moves-to-its-create-a-moveset-catalogue/)
- [WWE 2K26 10 Best Movesets, Ranked (Operation Sports)](https://www.operationsports.com/wwe-2k26-10-best-movesets-ranked/)
