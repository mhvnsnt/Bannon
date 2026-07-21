#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMeshCompositor.h"
#include "BannonGrappleIKBridge.h"
#include "BannonCharacterBuilder.generated.h"

UCLASS()
class BANNONCORE_API UBannonCharacterBuilder : public UObject
{
    GENERATED_BODY()

public:
    UBannonCharacterBuilder();

    UPROPERTY(BlueprintReadOnly, Category = "Bannon|Creation")
    UBannonMeshCompositor* MeshCompositor;

    UPROPERTY(BlueprintReadOnly, Category = "Bannon|Creation")
    UBannonGrappleIKBridge* IKBridge;

    // Extreme micro-morphing arrays
    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    TMap<FName, float> MorphTargets;

    // Micro-Morphing & Physics Sync
    UFUNCTION(BlueprintCallable, Category = "Bannon|Creation")
    void ApplyMorphAndSyncPhysics();
};
