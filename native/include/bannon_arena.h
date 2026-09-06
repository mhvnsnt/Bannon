#pragma once
// BANNON arena bounds. Same ragdoll core; only the environment collision matrix changes.
// Wrestling = bounded ring (ropes push back). God Within (Tekken-style) = open arena, free traversal.
#include "bannon_math.h"

namespace bannon {

enum ArenaMode { RING_4, RING_6, OPEN };   // OPEN = God Within open-arena traversal

struct Arena {
    ArenaMode mode = RING_4;
    float floorY   = 0.0f;
    float halfSize = 3.0f;   // ring half-extent; ignored when OPEN uses openHalf
    float openHalf = 30.0f;  // God Within stage half-extent
    float ropeY    = 1.2f;   // top rope height (ring only)
    float restitution = 0.35f;

    // clamp a body to the environment; returns true if it hit a bound (for rope-rebound / stage edge)
    bool contain(Vec3& pos, Vec3& vel) const {
        bool hit = false;
        if (pos.y < floorY) { pos.y = floorY; vel.y = -vel.y * restitution; hit = true; }

        if (mode == OPEN) {
            // open stage: only a soft outer wall so fighters can traverse freely
            if (std::fabs(pos.x) > openHalf) { pos.x = (pos.x > 0 ? openHalf : -openHalf); vel.x = -vel.x * restitution; hit = true; }
            if (std::fabs(pos.z) > openHalf) { pos.z = (pos.z > 0 ? openHalf : -openHalf); vel.z = -vel.z * restitution; hit = true; }
            return hit;
        }

        // ring: ropes rebound bodies below ropeY at the boundary; above ropeY they can go over
        float lim = halfSize;
        if (pos.y < ropeY) {
            if (std::fabs(pos.x) > lim) { pos.x = (pos.x > 0 ? lim : -lim); vel.x = -vel.x * (restitution + 0.3f); hit = true; }
            if (std::fabs(pos.z) > lim) { pos.z = (pos.z > 0 ? lim : -lim); vel.z = -vel.z * (restitution + 0.3f); hit = true; }
        }
        return hit;
    }
};

} // namespace bannon
