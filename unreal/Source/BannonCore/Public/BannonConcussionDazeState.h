#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "GameFramework/Character.h"
#include "BannonConcussionDazeState.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonConcussionDazeState : public UActorComponent
{
    GENERATED_BODY()

public:
    UBannonConcussionDazeState();

    UFUNCTION(BlueprintCallable, Category = "Physics|Reactions")
    void TriggerConcussionStagger(ACharacter* Defender, float HeadTraumaLevel, float CurrentHealth);

protected:
    virtual void BeginPlay() override;
    
    // Physics-driven wobble parameters
    float BaseWobbleIntensity;
    float StaggerDuration;
};
