#include "BannonAudienceHostility.h"

void UBannonAudienceHostility::CalculateTrashThrowProbability(float CharacterAlignment, float CrowdHeat, bool& bWillThrowWeapon)
{
    // If a heel (- alignment) has massive heat, the crowd throws trash and weapons into the ring.
    if (CharacterAlignment < -50.0f && CrowdHeat > 80.0f)
    {
        // 5% chance per tick/evaluation to throw an object from the crowd
        bWillThrowWeapon = (FMath::RandRange(0, 100) < 5);
    }
    else
    {
        bWillThrowWeapon = false;
    }
}
