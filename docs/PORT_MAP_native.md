# BANNON → native engine (UE5 / Unity) port map

The BANNON engine (one ~35k-line HTML file) is the **master architectural
blueprint**. The math is engine-agnostic — vectors, quaternions, matrices. This maps
each core system to its native target so the two-agent team can translate
syntax-by-syntax without redesigning. Sequencing: finish + validate the DNA-CAW loop
in three.js FIRST (done — see DNA_SCHEMA.md), THEN port.

## Immutable laws (carry over verbatim, both engines)
- `MAX_HP = 10000`, `DMG_SCALE` per engine, `MAX_BODY_VEL = 3.8 m/s` (per-body hard
  cap on EVERY ragdoll body — verlet post-constraint clamp + Rapier visceralImpact).
- Poise-driven crumple: stamina decoupled from HP; crumple state strictly off poise;
  joint motor stiffness ∝ current poise (never decouple these).
- On hit: 0.5 linear / 0.7 angular damping spike ~0.5s.

## System → native mapping
| BANNON system (three.js/JS)                | Unity (C#)                         | Unreal (C++/Chaos)                     |
|--------------------------------------------|------------------------------------|----------------------------------------|
| Verlet ragdoll + 15-iter bone constraints  | PhysX articulation / configurable joints w/ drive | Chaos physics control rig / PhysicsAsset |
| Spring3 joints (`this.J`, critically damped)| Rigidbody + spring joint / JointDrive | Physical Animation Component drives    |
| `worldJoint()` filtered read               | bone world transform (smoothed)    | GetSocketTransform (smoothed)          |
| BBODY procedural mesh + morph relief       | **base GLB + BlendShapes** (drop procedural to retro attire) | base SkeletalMesh + Morph Targets |
| DNA-CAW (`BANNON_DNA`)                      | SetBlendShapeWeight + bone.localScale + RenderTexture composite | SetMorphTarget + bone scale + dynamic material |
| GRAPPLE_POSITIONS liftPoses + PD coupling  | animation-free driven pose + joint drive targets | Physical Animation profile per phase |
| poise / stamina / hp two-layer health      | plain C# fields (1:1)              | UStruct fields (1:1)                    |
| match rules engine (multi-man/LMS/etc)     | GameMode + state machine           | AGameMode + state machine               |
| BROADCAST_GRADE post pass                  | post-process volume / URP renderer feature | PostProcessVolume + material          |
| crowd/rope InstancedMesh                   | GPU instancing / Graphics.DrawMeshInstanced | Instanced Static Mesh / Niagara       |

## Retro tier
The three.js procedural swept-tube models become **unlockable low-poly retro /
training-dummy attires** in the native build — near-zero cost, honors the dev
history, A/B contrast vs the sculpted base mesh.

## Order of operations for the port
1. Author ONE male + ONE female base mesh (40-80k, anatomical edge loops, universal
   UV, 50-60 FACS/body BlendShapes) in Blender. Import both, prove BlendShape +
   bone-scale + collider-recalc against BANNON_DNA in three.js.
2. Stand up the native project; port the immutable laws + poise engine (pure logic).
3. Port systems in the table order (physics → pose/grapple → rules → render).
4. Feed the canon roster DNA (from Supabase `roster` + canon/*.md) into both.
