// Copyright BANNON.
#include "BannonFighterCharacter.h"

void ABannonFighterCharacter::RefreshDamageMaterials()
{
    UMeshComponent* MeshComp = GetMesh();
    if (MeshComp)
    {
        MeshComp->SetScalarParameterValueOnMaterials(FName("HeadCutAlpha"), HeadCutAlpha);
        MeshComp->SetScalarParameterValueOnMaterials(FName("TorsoBruiseAlpha"), TorsoBruiseAlpha);
    }
}
