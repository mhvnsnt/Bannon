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

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FString SuperstarName;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FString EntranceName;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FName CommentaryAudioFlag;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    float MaxHitPoints = 10000.0f;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    float VelocityLimit = 3.8f;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    float DamageScale = 8.0f;

    UPROPERTY(BlueprintReadWrite, Category = "Bannon|Creation")
    FName SelectedMenuPose;

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
