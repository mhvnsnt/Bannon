#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralBalanceRecoveryMatrix.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralBalanceRecoveryMatrix : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonProceduralBalanceRecoveryMatrix();

    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void CalculateBalanceState(FVector CenterOfMass, FVector BaseOfSupport, float AngularVelocity);

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
    float RecoveryThreshold;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
    float FallAngularVelocityLimit;

protected:
    virtual void BeginPlay() override;

private:
    bool bIsRagdolling;
};
