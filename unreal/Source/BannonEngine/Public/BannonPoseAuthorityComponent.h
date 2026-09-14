#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonPoseAuthorityComponent.generated.h"

UENUM(BlueprintType)
enum class EBannonPoseOwner : uint8
{
    None,
    Locomotion,
    Animation,
    FootIK,
    Grapple,
    Physical,
    Final
};

USTRUCT(BlueprintType)
struct FBannonPoseWrite
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FName Bone;
    UPROPERTY(BlueprintReadOnly) EBannonPoseOwner Owner = EBannonPoseOwner::None;
    UPROPERTY(BlueprintReadOnly) uint64 Frame = 0;
};

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONENGINE_API UBannonPoseAuthorityComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UBannonPoseAuthorityComponent();

    UFUNCTION(BlueprintCallable, Category="Bannon|Pose")
    void BeginPoseFrame();

    UFUNCTION(BlueprintCallable, Category="Bannon|Pose")
    bool ClaimBone(FName Bone, EBannonPoseOwner Owner);

    UFUNCTION(BlueprintCallable, Category="Bannon|Pose")
    void ReleaseClaims();

    UFUNCTION(BlueprintPure, Category="Bannon|Pose")
    EBannonPoseOwner GetBoneOwner(FName Bone) const;

    UFUNCTION(BlueprintPure, Category="Bannon|Pose")
    int32 GetContestedWriteCount() const { return ContestedWriteCount; }

    UFUNCTION(BlueprintPure, Category="Bannon|Pose")
    int32 GetTotalWriteCount() const { return TotalWriteCount; }

    UFUNCTION(BlueprintPure, Category="Bannon|Pose")
    uint64 GetPoseFrame() const { return PoseFrame; }

    const TMap<FName, EBannonPoseOwner>& GetClaims() const { return Claims; }

private:
    UPROPERTY() TMap<FName, EBannonPoseOwner> Claims;
    UPROPERTY() uint64 PoseFrame = 0;
    UPROPERTY() int32 ContestedWriteCount = 0;
    UPROPERTY() int32 TotalWriteCount = 0;
};
