#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "BannonCrowdMomentumUI.generated.h"

UCLASS()
class BANNONCORE_API UBannonCrowdMomentumUI : public UUserWidget
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "UI|Momentum")
    void UpdateCrowdHeatVisuals(float CurrentHeat, float MaxHeat);

protected:
    // Bind to the underlying momentum algorithm
    UPROPERTY(BlueprintReadOnly, Category = "UI|Momentum")
    float VisualHeatRatio;
};
