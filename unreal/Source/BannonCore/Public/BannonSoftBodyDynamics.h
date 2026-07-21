#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSoftBodyDynamics.generated.h"

UCLASS(ClassGroup=(BannonPhysics), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSoftBodyDynamics : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonSoftBodyDynamics();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void InitializeSoftBodyClusters(float MuscleDensity, float FatDensity, class USkeletalMeshComponent* TargetMesh);

private:
    void UpdateJiggleSolver(float DeltaTime);

    float LocalMuscleDensity;
    float LocalFatDensity;
    TArray<FName> SoftBodyBones;
};
