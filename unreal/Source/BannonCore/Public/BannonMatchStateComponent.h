#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMatchStateComponent.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMatchStateComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UBannonMatchStateComponent();

protected:
    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|MatchState")
    void InitiateRefereeCount(float DeltaTime);
    
    UFUNCTION(BlueprintCallable, Category = "Bannon|MatchState")
    void ResetRefereeCount();

    UFUNCTION(BlueprintCallable, Category = "Bannon|MatchState")
    bool ValidateRingBoundaries(FVector Location);

private:
    float CurrentRefereeCount;
    const float COUNT_SPEED = 1.0f;
    const float MAX_COUNT = 3.0f;
};
