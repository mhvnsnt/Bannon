#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BannonMatchStateMachine.generated.h"

UENUM(BlueprintType)
enum class EMatchState : uint8 {
    Init,
    EntrancePreview,
    EntranceRunning,
    EntranceBrawl,
    MatchActive,
    MatchFinished,
    VictorySequence,
    PostMatchBrawl
};

UCLASS()
class BANNONCORE_API ABannonMatchStateMachine : public AActor {
    GENERATED_BODY()
public:
    ABannonMatchStateMachine();
    
    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "Match State")
    EMatchState CurrentState;

    UFUNCTION(BlueprintCallable, Category = "Match State")
    void TransitionToState(EMatchState NewState);
    
    UFUNCTION(BlueprintCallable, Category = "Match State")
    void LockMatchMechanics(bool bLock);
};
