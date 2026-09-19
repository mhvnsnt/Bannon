#include "BannonMultiBodyReplication.h"

void UBannonMultiBodyReplication::ReplicatePileupPhysics(float ClientDeviationTolerance, const FVector& ServerCenterOfMass, const FVector& ClientCenterOfMass, bool& bForceClientSnap)
{
    // Extreme MDickie physics pile-ups (3+ bodies) cause massive network divergence.
    // This checks if the client's local physics simulation has deviated too far from the authoritative server state.
    float DeviationDistance = FVector::Dist(ServerCenterOfMass, ClientCenterOfMass);
    
    if (DeviationDistance > ClientDeviationTolerance)
    {
        bForceClientSnap = true; // Client physics went rogue, force hard snap to server coordinates
    }
    else
    {
        bForceClientSnap = false; // Allow local simulation to continue smoothly
    }
}
