#include "BannonEnvironmentalGrapple.h"

void UBannonEnvironmentalGrapple::CalculateProximityIKTargets(const FVector& GrappleLocation, const TArray<FVector>& NearbyEnvironmentNodes, FVector& OutLeftHandIK, FVector& OutRightHandIK, bool& bIsEnvironmentInteraction)
{
    // Procedurally aligns IK hands/feet when grappling near ropes, turnbuckles, or barricades
    // Allows for contextual moves (e.g. smashing a face into the turnbuckle instead of a standard suplex)
    bIsEnvironmentInteraction = false;
    float MinDist = 150.0f; // 1.5 meters proximity check

    for (const FVector& Node : NearbyEnvironmentNodes)
    {
        if (FVector::Dist(GrappleLocation, Node) < MinDist)
        {
            // Lock hands to the environment node (e.g. grabbing the top rope for leverage)
            OutLeftHandIK = Node + FVector(-10, 0, 0); 
            OutRightHandIK = Node + FVector(10, 0, 0);
            bIsEnvironmentInteraction = true;
            break; // Stop at the first valid node
        }
    }
}
