// Copyright BANNON.
#include "BannonTauntManager.h"

void UBannonTauntManager::ExecuteTaunt(AActor* Fighter, FName TauntID)
{
    UE_LOG(LogTemp, Log, TEXT("Executing taunt: %s"), *TauntID.ToString());
}
