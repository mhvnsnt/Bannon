// AI ORIENTATION BLOCK v114
// godmode prefix. Autonomous. Constants immutable. No WebGL/Three legacy.

#pragma once
#include <vector>
#include <cmath>
#include <algorithm>

namespace bannon {

constexpr float MAX_HP = 10000.0f;
constexpr float DMG_SCALE = 8.0f;
constexpr float MAX_BODY_VEL = 3.8f;

struct Vec3 { float x, y, z; };
struct Quat { float w, x, y, z; };

struct PoiseState {
    float current = 1000.0f;
    float max = 1000.0f;
    bool crumpleActive = false;
};

struct HitStop {
    float durationFrames = 0.0f;  // 3-5 heavy
    float timeDilation = 1.0f;
};

class PhysicsLaws {
public:
    static void EnforceVelocity(Vec3& vel) {
        float speed = std::sqrt(vel.x*vel.x + vel.y*vel.y + vel.z*vel.z);
        if (speed > MAX_BODY_VEL) {
            float scale = MAX_BODY_VEL / speed;
            vel.x *= scale; vel.y *= scale; vel.z *= scale;
        }
    }

    static void ApplyDamage(float& hp, float rawDmg, PoiseState& poise) {
        float dmg = rawDmg * DMG_SCALE;
        hp = std::max(0.0f, hp - dmg);
        poise.current -= dmg * 0.6f;  // Poise independent
        if (poise.current <= 0) poise.crumpleActive = true;
    }

    static void BlendRagdollLimb(Vec3& bonePos, const Vec3& mocapPos, float alpha, const HitStop& stop) {
        bonePos.x = (bonePos.x * alpha) + (mocapPos.x * (1.0f - alpha));
        bonePos.y = (bonePos.y * alpha) + (mocapPos.y * (1.0f - alpha));
        bonePos.z = (bonePos.z * alpha) + (mocapPos.z * (1.0f - alpha));
    }
    
    static float RecalcPoiseFromMorph(float torsoVol, float neckVol) {
        return 800.0f + (torsoVol * 2.0f) + (neckVol * 1.5f);  // Dynamic
    }
};

} // namespace bannon
