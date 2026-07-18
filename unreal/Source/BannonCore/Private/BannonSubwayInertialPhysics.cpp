#include "BannonSubwayInertialPhysics.h"

void UBannonSubwayInertialPhysics::CalculateInertialImpact(const FVector& TrainVelocity, const FVector& BaseStrikeImpulse, bool bIsTrainBraking, FVector& OutFinalImpulse)
{
    // Replicates MDickie's subway fighting dynamics.
    // When fighting on a moving train, the vehicle's momentum is added to ragdoll impulses.
    OutFinalImpulse = BaseStrikeImpulse;

    // If the train slams on the brakes while a character is in the air (e.g. taking a back body drop), 
    // the sudden deceleration throws them violently forward.
    if (bIsTrainBraking)
    {
        // Add the opposite of the train's velocity vector to the airborne wrestler to simulate sudden stopping inertia
        OutFinalImpulse += (TrainVelocity * 1.5f); 
    }
    else
    {
        // Standard moving train adds a slight wobble/drift to all aerial maneuvers
        OutFinalImpulse += (TrainVelocity * 0.1f);
    }
}
