#pragma once

#include "CoreMinimal.h"
#include "AIController.h"
#include "BannonNeuralNetBrawlerAI.generated.h"

USTRUCT(BlueprintType)
struct FObservationFrame
{
    GENERATED_BODY()

    UPROPERTY()
    FVector TargetTrajectory;
    
    UPROPERTY()
    float TargetDistance;
    
    UPROPERTY()
    bool bIsConstraintActive;

    UPROPERTY()
    float DistanceToRopes;

    UPROPERTY()
    FVector RopeAlignmentVector;
};

UCLASS()
class BANNONCORE_API ABannonNeuralNetBrawlerAI : public AAIController
{
    GENERATED_BODY()

public:
    ABannonNeuralNetBrawlerAI();
    virtual void Tick(float DeltaTime) override;

protected:
    virtual void BeginPlay() override;

private:
    TArray<FObservationFrame> MemoryTensorBuffer;
    const int32 MAX_MEMORY_FRAMES = 60;
    FTimerHandle NeuralTickHandle;
    
    UFUNCTION()
    void TickNeuralInference();

    void EvaluateCombatEnvironment(FObservationFrame& OutFrame);
    float CalculateRewardWeight(float PoiseDamage, bool bSelfCrumple);
    void ExecuteCombatAction(FVector ActionImpulse, FString ActionType);
};
