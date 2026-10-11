#include "BannonInvertedPiledriverConstraint.h"

UBannonInvertedPiledriverConstraint::UBannonInvertedPiledriverConstraint()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonInvertedPiledriverConstraint::EstablishInvertedHold(AActor* Attacker, AActor* Defender)
{
    if (!Attacker || !Defender) return;
    // 1. Disable Defender's collision with Attacker to prevent physics jitter
    // 2. Rotate Defender 180 degrees on pitch/roll
    // 3. Constrain Defender's pelvis to Attacker's torso via a rigid physics constraint
}

void UBannonInvertedPiledriverConstraint::ExecuteDriver(AActor* Attacker, AActor* Defender)
{
    if (!Attacker || !Defender) return;
    // 1. Break the rigid constraint
    // 2. Apply combined downward velocity (Attacker dropping to knees + gravity)
    // 3. Ensure Defender's head bone acts as the primary collision hull against the mat
}
