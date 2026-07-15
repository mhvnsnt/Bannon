// Copyright BANNON.
#include "BannonInjuryManager.h"
#include "BannonFighterCharacter.h"

void UBannonInjuryManager::RegisterInjury(AActor* Fighter, FName BodyPart, float DamageAmount)
{
    ABannonFighterCharacter* FighterChar = Cast<ABannonFighterCharacter>(Fighter);
    if (FighterChar)
    {
        if (BodyPart == FName("Head"))
        {
            FighterChar->HeadCutAlpha = FMath::Clamp(FighterChar->HeadCutAlpha + (DamageAmount * 0.01f), 0.0f, 1.0f);
        }
        else if (BodyPart == FName("Torso"))
        {
            FighterChar->TorsoBruiseAlpha = FMath::Clamp(FighterChar->TorsoBruiseAlpha + (DamageAmount * 0.01f), 0.0f, 1.0f);
        }
        FighterChar->RefreshDamageMaterials();
    }
}
