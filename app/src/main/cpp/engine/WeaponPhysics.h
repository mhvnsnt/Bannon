#pragma once
#include <string>

struct BaseWeapon {
    std::string name;
    float mass; // Physical weight determining momentum and stamina drag
};

class WeaponPhysics {
public:
    void pickupWeapon(const BaseWeapon& weapon, float characterStamina, float armDamage);
    void executeWeaponStrike(const BaseWeapon& weapon, float targetVelocity, bool isMiss, bool isReversed, float& characterStamina, float armDamage);
};
