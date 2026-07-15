// Copyright BANNON.
#include "BannonFighterCharacter.h"

void ABannonFighterCharacter::RefreshDamageMaterials()
{
    // Implementation: Update Material Instance scalar parameters based on Alpha values
    UE_LOG(LogTemp, Log, TEXT("Refreshing damage materials: HeadCut=%f, TorsoBruise=%f"), HeadCutAlpha, TorsoBruiseAlpha);
}
