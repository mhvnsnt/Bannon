#include "BannonWrestlingMpireLegacy.h"

void UBannonWrestlingMpireLegacy::TransferRagdollMomentum(FVector AttackerVelocity, float MassRatio, FVector& DefenderLaunchVector)
{
    // The classic MDickie "Wrestling Mpire" physics engine feature:
    // High velocity + high mass differential = astronomical launch vectors
    // This creates the iconic "thrown out of the ring into the third row" effect while maintaining stability
    DefenderLaunchVector = AttackerVelocity * (MassRatio * 1.5f);
}

void UBannonWrestlingMpireLegacy::EvaluateMpireDismembermentRisk(float WeaponImpactForce, bool& bTriggerExtremeDamage)
{
    // Wrestling Mpire fork features extreme physical consequences
    // A train or explosive impact might cause a visual amputation or extreme bleeding state in the legacy fork
    if (WeaponImpactForce > 15000.0f)
    {
        bTriggerExtremeDamage = true;
    }
    else
    {
        bTriggerExtremeDamage = false;
    }
}
