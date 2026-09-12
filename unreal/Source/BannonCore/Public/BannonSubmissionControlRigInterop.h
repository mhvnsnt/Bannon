#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSubmissionControlRigInterop.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSubmissionControlRigInterop : public UActorComponent
{
    GENERATED_BODY()
public:
    UBannonSubmissionControlRigInterop();
    
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void InjectJointDeformation(class USkeletalMeshComponent* Mesh, FName TargetJoint, float AppliedTorque);
};
