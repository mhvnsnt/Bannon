// Copyright BANNON.
#include "BannonTauntManager.h"

FBannonBuffs UBannonTauntManager::ExecuteTaunt(FName TauntID)
{
    FBannonBuffs Buffs;
    if (TauntID == "Aggressive") { Buffs.Strength = 1.2f; Buffs.Momentum = 1.1f; }
    else if (TauntID == "Speedster") { Buffs.Speed = 1.2f; Buffs.Momentum = 1.05f; }
    
    UE_LOG(LogTemp, Log, TEXT("Taunt executed: %s"), *TauntID.ToString());
    return Buffs;
}
