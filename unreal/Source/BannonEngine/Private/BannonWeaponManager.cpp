// Copyright BANNON.
#include "BannonWeaponManager.h"

void ABannonWeaponManager::InteractWithWeapon(AActor* WeaponActor)
{
    if (WeaponActor) {
        bIsHoldingWeapon = !bIsHoldingWeapon;
        UE_LOG(LogTemp, Log, TEXT("Interacted with weapon: %s. Holding: %d"), *WeaponActor->GetName(), bIsHoldingWeapon);
    }
}
