#pragma once
#include "CoreMinimal.h"
#include "AIController.h"
#include "BannonRingGeneralshipAI.generated.h"

UCLASS()
class BANNONCORE_API ABannonRingGeneralshipAI : public AAIController {
    GENERATED_BODY()
public:
    ABannonRingGeneralshipAI();
    virtual void Tick(float DeltaTime) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|AI")
    void EvaluateSpacialPositioning(float CurrentPoise, float TargetMomentum);

private:
    void ExecuteDefensiveSpacing(class AActor* TargetOpponent);
    void ExecuteCornerTrap(class AActor* TargetOpponent);
};
