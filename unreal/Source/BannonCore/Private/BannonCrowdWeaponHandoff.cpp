#include "BannonCrowdWeaponHandoff.h"

void UBannonCrowdWeaponHandoff::EvaluateFanHandoff(float CrowdHeatMatrix, float DistanceToBarricade, bool& bWillOfferWeapon, FString& OutWeaponClass)
{
    // Interactive crowd mechanic: Fans dynamically pass weapons to wrestlers over the barricade based on alignment.
    
    // Only offer weapons if the wrestler is right up against the barricade
    if (DistanceToBarricade < 100.0f)
    {
        // If the wrestler is a massive crowd favorite (Heat > 50) or a massive heel (Heat < -50), 
        // fans will either help them or hand them dangerous objects to create chaos.
        if (CrowdHeatMatrix > 50.0f)
        {
            bWillOfferWeapon = true;
            OutWeaponClass = TEXT("FoldingChair"); // Helping the babyface
        }
        else if (CrowdHeatMatrix < -50.0f)
        {
            // The crowd throws garbage or hands them weak objects to mock them
            bWillOfferWeapon = true;
            OutWeaponClass = TEXT("EmptyBottle"); 
        }
        else
        {
            bWillOfferWeapon = false; // Apathetic fans just watch
        }
    }
    else
    {
        bWillOfferWeapon = false;
    }
}
