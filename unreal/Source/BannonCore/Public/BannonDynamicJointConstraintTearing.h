#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicJointConstraintTearing.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicJointConstraintTearing : public UActorComponent
{
    GENERATED_BODY()
public:    
    UBannonDynamicJointConstraintTearing();
    
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void SimulateHyperExtension(FName JointName, float AppliedTorque);

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
    float TearThreshold;
};
