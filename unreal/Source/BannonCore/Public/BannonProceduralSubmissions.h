#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralSubmissions.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralSubmissions : public UActorComponent
{
    GENERATED_BODY()
public:
    UBannonProceduralSubmissions();
    
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void ApplyKinematicTorque(class USkeletalMeshComponent* AttackerMesh, class USkeletalMeshComponent* DefenderMesh, FName DefenderLimb, float DeltaTime);
};
