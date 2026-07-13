#pragma once
// BANNON native — ANIMATION / SKINNING BRIDGE (the Three.js → UE5/Unity migration layer).
//
// The web engine drives a GLB skeleton by aiming each bone at the active-ragdoll joints, and
// auto-skins the owner's Tripo bodies with a geodesic solver. Two hard-won fixes live in the JS
// (BANNON_v150.html `_aimLocal`, tools/rigready/skin.cjs v4.4) — this header ports BOTH as
// engine-agnostic C++ so they carry verbatim into a native runtime:
//
//   1. ROLL-STABLE BONE AIM — aiming a bone with a bare shortest-arc rotation leaves the roll about
//      the aim axis UNDEFINED, so near-vertical limbs flip (the "spiral leg"). We build full
//      orthonormal frames sharing one up-reference so the roll is deterministic. In UE this IS the
//      Control Rig "Aim" node with a stable secondary/up axis; in Unity, a LookRotation with an
//      explicit up. Kept here so the exact behaviour is testable and identical across engines.
//
//   2. LIMB-FAMILY SKIN SEPARATION — Tripo bodies ship in an A-pose with the hands against the
//      thighs, so a surface-flow skinner bleeds the arm bone into the leg (the mesh tears when the
//      arm swings). Arm and leg are never anatomically adjacent, so any arm↔leg vertex adjacency is
//      a pose artifact. `limbFamily()` classifies a vertex; `isCrossLimbEdge()` marks edges to cut
//      before weight propagation; `seedAllowed()` gates bone seeding. In UE this maps to authoring
//      skin weights / a Control Rig pose-space fixup; the classification math is identical.
//
// Nothing here depends on a renderer — Vec3/Quat only. Tested in test_anim_bridge.cpp.
#include "bannon_math.h"
#include "bannon_core.h"

namespace bannon {

// ── point ↔ segment distance (shared by skinning + collision) ──────────────────────────────────
inline float segmentDist(const Vec3& p, const Vec3& a, const Vec3& b) {
    Vec3 ab = b - a; float t = 0.f; float denom = ab.lengthSq();
    if (denom > 1e-9f) { t = (p - a).dot(ab) / denom; t = t < 0 ? 0 : (t > 1 ? 1 : t); }
    return (p - (a + ab * t)).length();
}

// ── 1. ROLL-STABLE BONE AIM ────────────────────────────────────────────────────────────────────
// Rotate a bone whose rest forward is `restFwd` so it points along `targetDir` (both in the SAME
// space), with a deterministic roll locked by the world axis least parallel to the aim. This is the
// portable twin of the JS `_aimLocal` and of a UE Control Rig Aim node.
inline Quat rollStableAim(const Vec3& restFwd, const Vec3& targetDir) {
    Vec3 tf = targetDir.normalized();
    if (tf.lengthSq() < 1e-9f) return Quat();
    Vec3 rf = restFwd.normalized();
    // up = axis least parallel to the aim → never degenerate against a straight-down limb
    float ax = std::fabs(tf.x), ay = std::fabs(tf.y), az = std::fabs(tf.z);
    Vec3 up = (ay <= ax && ay <= az) ? Vec3(0,1,0) : (az <= ax && az <= ay) ? Vec3(0,0,1) : Vec3(1,0,0);
    auto basis = [](const Vec3& f, Vec3 u, Vec3& r, Vec3& uu) {
        r = u.cross(f);
        if (r.lengthSq() < 1e-6f) { u = Vec3(1,0,0); r = u.cross(f); }
        r = r.normalized(); uu = f.cross(r);
    };
    Vec3 tr, tu, rr, ru; basis(tf, up, tr, tu); basis(rf, up, rr, ru);
    // quaternion from the rest frame to the target frame (both orthonormal) = pure roll-locked swing
    Quat qt = quatFromBasis(tr, tu, tf), qr = quatFromBasis(rr, ru, rf);
    return qt * qr.conjugate();
}

// ── 2. LIMB-FAMILY SKIN SEPARATION (the A-pose rigger, portable) ────────────────────────────────
enum LimbFamily { LF_ARM = 0, LF_LEG = 1, LF_TORSO = 2 };

// Bone segments grouped by family. Caller fills these from the rig (JOINT_REST or the GLB skeleton).
struct FamilySegments {
    const Vec3* armA;  const Vec3* armB;  int armN;    // arm bone segments (upper/fore/hand ×2)
    const Vec3* legA;  const Vec3* legB;  int legN;    // leg bone segments (thigh/shin/foot ×2)
    const Vec3* torA;  const Vec3* torB;  int torN;    // torso segments (hips/spine/neck/head)
};
inline float nearestSeg(const Vec3& p, const Vec3* A, const Vec3* B, int n) {
    float m = 1e30f; for (int i = 0; i < n; ++i) { float d = segmentDist(p, A[i], B[i]); if (d < m) m = d; }
    return m;
}
// which limb a vertex physically belongs to (nearest family) — the JS v4.4 `fam` classifier.
inline LimbFamily limbFamily(const Vec3& p, const FamilySegments& s) {
    float a = nearestSeg(p, s.armA, s.armB, s.armN);
    float l = nearestSeg(p, s.legA, s.legB, s.legN);
    float t = nearestSeg(p, s.torA, s.torB, s.torN);
    if (a <= l && a <= t) return LF_ARM;
    if (l <= t) return LF_LEG;
    return LF_TORSO;
}
// an adjacency edge to CUT before weight propagation: arm↔leg is never anatomical (torso links stay).
inline bool isCrossLimbEdge(LimbFamily a, LimbFamily b) {
    return (a == LF_ARM && b == LF_LEG) || (a == LF_LEG && b == LF_ARM);
}
// may bone-family `boneFam` seed vertex-family `vertFam`? (arm bone can't seed a leg vertex, etc.)
inline bool seedAllowed(LimbFamily boneFam, LimbFamily vertFam) {
    if (boneFam == LF_ARM && vertFam == LF_LEG) return false;
    if (boneFam == LF_LEG && vertFam == LF_ARM) return false;
    return true;
}

} // namespace bannon
