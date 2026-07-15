// Copyright BANNON.
#include "BannonFighterCharacter.h"

ABannonFighterCharacter::ABannonFighterCharacter()
{
    TauntManager = CreateDefaultSubobject<UBannonTauntManager>(TEXT("TauntManager"));
}

void ABannonFighterCharacter::RefreshDamageMaterials()
{
    UMeshComponent* MeshComp = GetMesh();
    if (MeshComp)
    {
        MeshComp->SetScalarParameterValueOnMaterials(FName("HeadCutAlpha"), HeadCutAlpha);
        MeshComp->SetScalarParameterValueOnMaterials(FName("TorsoBruiseAlpha"), TorsoBruiseAlpha);
    }
}

void ABannonFighterCharacter::TriggerTaunt(FName TauntID)
{
    if (TauntManager)
    {
        TauntManager->ExecuteTaunt(this, TauntID);
    }
}
