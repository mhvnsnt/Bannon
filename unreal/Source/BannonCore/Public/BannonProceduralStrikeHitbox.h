#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralStrikeHitbox.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralStrikeHitbox : public UActorComponent
{
    GENERATED_BODY()
public:
    UBannonProceduralStrikeHitbox();
    
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void CalculateTargetedStrike(FVector AttackerLimbPos, FVector AttackerLimbVelocity, class USkeletalMeshComponent* DefenderMesh, FName TargetBone);
};
