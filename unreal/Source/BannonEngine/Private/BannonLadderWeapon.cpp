// Copyright BANNON.
#include "BannonLadderWeapon.h"

void ABannonLadderWeapon::ClimbLadder(AActor* Fighter)
{
    if (bIsSetUp) {
        UE_LOG(LogTemp, Log, TEXT("Climbing ladder with fighter: %s"), *Fighter->GetName());
    }
}
