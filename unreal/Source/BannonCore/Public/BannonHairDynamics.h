#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonHairDynamics.generated.h"

UCLASS(ClassGroup=(BannonPhysics), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonHairDynamics : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonHairDynamics();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void RegisterHairStrands(class USkeletalMeshComponent* HairMesh);

private:
    void EvaluateStrandPhysics(float DeltaTime);
    float StrandStiffness;
    float StrandDamping;
};
