#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameStateBase.h"
#include "BannonPlayMatchState.generated.h"

UCLASS()
class BANNONCORE_API ABannonPlayMatchState : public AGameStateBase
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintReadOnly, Category="Bannon|Match")
    bool bIsScriptTorn;

    UFUNCTION(BlueprintCallable, Category="Bannon|Match")
    void InitializeMatch(const FString& MatchDataJSON);

    UFUNCTION(BlueprintCallable, Category="Bannon|Match")
    void EnforcePhysicsConstants();
};
