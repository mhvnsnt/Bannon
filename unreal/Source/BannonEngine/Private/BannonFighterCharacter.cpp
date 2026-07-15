// Copyright BANNON.
#include "BannonFighterCharacter.h"

void ABannonFighterCharacter::RefreshDamageMaterials()
{
    // Scalar Parameter Mapping
    // GetMesh()->SetScalarParameterValueOnMaterials(FName("HeadCutAlpha"), HeadCutAlpha);
    // GetMesh()->SetScalarParameterValueOnMaterials(FName("TorsoBruiseAlpha"), TorsoBruiseAlpha);
    UE_LOG(LogTemp, Log, TEXT("Refreshing damage materials: HeadCut=%f, TorsoBruise=%f"), HeadCutAlpha, TorsoBruiseAlpha);
}
