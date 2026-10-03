#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonAdrenalineMasking.generated.h"

// Phase 9 #75: Adrenaline Masking
UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonAdrenalineMasking : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonAdrenalineMasking();

    // High momentum temporarily nullifies IK limping penalties (The "Hulking Up" effect)
    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    void EvaluateAdrenalineRush(float CurrentMomentum, float Threshold);

    UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
    bool IsLimpingMasked() const;

protected:
    virtual void BeginPlay() override;

private:
    bool bIsAdrenalineActive;
};
