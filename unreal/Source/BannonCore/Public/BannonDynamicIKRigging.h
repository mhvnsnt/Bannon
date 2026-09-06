#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicIKRigging.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicIKRigging : public UActorComponent
{
    GENERATED_BODY()
public:
    UBannonDynamicIKRigging() { PrimaryComponentTick.bCanEverTick = false; }
    
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void WireFullBodyIKTurnbuckle(class USkeletalMeshComponent* AttackerMesh, FVector TurnbuckleLocation, FVector& OutLeftHandIK, FVector& OutRightHandIK);

    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void CalculateRopeWalkFootPlacement(class USkeletalMeshComponent* AttackerMesh, FVector RopeSplineLocation, float BalanceDelta, FVector& OutLeftFootIK, FVector& OutRightFootIK);

    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void MapHeightDependentGrappleIK(class USkeletalMeshComponent* AttackerMesh, class USkeletalMeshComponent* DefenderMesh, FName TargetBone, FVector& OutIKLocation);
};
