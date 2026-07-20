#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "GameFramework/Character.h"
#include "BannonHitReactionStepBack.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonHitReactionStepBack : public UActorComponent
{
    GENERATED_BODY()

public:
    UBannonHitReactionStepBack();

    UFUNCTION(BlueprintCallable, Category = "Physics|Reactions")
    void ApplyHitDisplacement(ACharacter* Defender, FVector ImpactForce, float MassRatio);

protected:
    virtual void BeginPlay() override;
};
