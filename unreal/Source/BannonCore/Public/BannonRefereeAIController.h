#pragma once
#include "CoreMinimal.h"
#include "AIController.h"
#include "BannonRefereeAIController.generated.h"

UCLASS()
class BANNONCORE_API ABannonRefereeAIController : public AAIController {
    GENERATED_BODY()
public:
    ABannonRefereeAIController();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Referee")
    void InitiatePinCountSequence(class AActor* DefendingFighter, class UPrimitiveComponent* RingMatCollider);

private:
    void ExecuteIKSnapAndCount(class AActor* DefendingFighter, class UPrimitiveComponent* RingMatCollider);
};
