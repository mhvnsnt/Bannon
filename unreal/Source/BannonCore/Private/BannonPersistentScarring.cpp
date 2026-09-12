#include "BannonPersistentScarring.h"

void UBannonPersistentScarring::ApplyPermanentScar(const FString& BoneName, float DamageDepth, TArray<FString>& OutPersistentScars)
{
    // Extreme lacerations bleed into the universe mode, leaving permanent visual scars on the mesh
    if (DamageDepth > 80.0f)
    {
        FString ScarEntry = BoneName + TEXT("_Scarred");
        OutPersistentScars.AddUnique(ScarEntry);
    }
}
