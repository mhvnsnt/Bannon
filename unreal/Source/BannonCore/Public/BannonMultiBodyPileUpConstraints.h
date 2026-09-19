#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "PhysicsEngine/PhysicsConstraintComponent.h"
#include "BannonMultiBodyPileUpConstraints.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMultiBodyPileUpConstraints : public UActorComponent
{
    GENERATED_BODY()
public:    
    UBannonMultiBodyPileUpConstraints();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void CalculateMultiBodyStacking(TArray<AActor*> StackedBodies);

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
    float MaxStackingPenetration;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
    float ForceDistributionMultiplier;

protected:
    virtual void BeginPlay() override;
};
