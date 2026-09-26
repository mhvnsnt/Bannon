#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonVictorySystem.generated.h"

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonVictorySystem : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonVictorySystem();
    
    UFUNCTION(BlueprintCallable, Category = "Victory")
    void TriggerVictorySequence(const FString& WinnerId, const FString& WinMethod);
    
    UFUNCTION(BlueprintCallable, Category = "Victory")
    void InitiatePostMatchBeatdown();
};
