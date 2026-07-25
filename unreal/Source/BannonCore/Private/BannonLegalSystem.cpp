#include "BannonLegalSystem.h"

void UBannonLegalSystem::ProcessBackstageAssault(float VictimDamage, bool bSecurityPresent, bool& bIsArrested, int32& JailSentencedWeeks)
{
    // MDickie Legacy: Court Cases / Jail System
    // If you severely injure someone backstage and security catches you, you go to jail.
    if (VictimDamage > 2000.0f && bSecurityPresent)
    {
        bIsArrested = true;
        JailSentencedWeeks = FMath::RandRange(2, 6); // Miss 2 to 6 weeks of TV time
    }
    else
    {
        bIsArrested = false;
        JailSentencedWeeks = 0;
    }
}
