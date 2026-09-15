#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonEntranceSystem.generated.h"

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonEntranceSystem : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonEntranceSystem();
    
    UFUNCTION(BlueprintCallable, Category = "Entrance")
    void TriggerEntrance(const FString& CharacterId);
    
    UFUNCTION(BlueprintCallable, Category = "Entrance")
    void InterruptEntrance(const FString& AttackerId, bool bIsAIAutonomous);
    
    UFUNCTION(BlueprintCallable, Category = "Entrance Audio")
    void PlayTTSBragLine(const FString& DialogueId);
};
