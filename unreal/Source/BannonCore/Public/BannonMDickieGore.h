#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMDickieGore.generated.h"

UCLASS()
class BANNONCORE_API UBannonMDickieGore : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void ApplyProceduralDismemberment(USkeletalMeshComponent* CharacterMesh, FName HitBoneName, float ImpactForce);

    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    void SpawnDynamicBloodDecals(const FVector& HitLocation, const FVector& ImpactNormal);
};
