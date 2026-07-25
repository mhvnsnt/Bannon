#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCommentaryEngine.generated.h"

UCLASS(ClassGroup=(BannonAudio), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCommentaryEngine : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonCommentaryEngine();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Commentary")
    void RegisterMatchEvent(const FString& EventDescription, float ImpactForce);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Commentary")
    void TriggerLLMCommentaryGeneration();

private:
    TArray<FString> MatchContextBuffer;
    float MomentumThreshold;

    void DispatchToLocalLLMNode(const FString& ContextPayload);
};
