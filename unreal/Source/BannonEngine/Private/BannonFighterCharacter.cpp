// Copyright BANNON.
#include "BannonFighterCharacter.h"

void ABannonFighterCharacter::RefreshDamageMaterials()
{
    UMeshComponent* MeshComp = GetMesh();
    if (MeshComp)
    {
        float ClampedHeadAlpha = FMath::Clamp(HeadCutAlpha, 0.0f, 1.0f);
        float ClampedTorsoAlpha = FMath::Clamp(TorsoBruiseAlpha, 0.0f, 1.0f);
        
        MeshComp->SetScalarParameterValueOnMaterials(FName("HeadCutAlpha"), ClampedHeadAlpha);
        MeshComp->SetScalarParameterValueOnMaterials(FName("TorsoBruiseAlpha"), ClampedTorsoAlpha);
    }
}
