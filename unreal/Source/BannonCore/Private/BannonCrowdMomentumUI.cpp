#include "BannonCrowdMomentumUI.h"

void UBannonCrowdMomentumUI::UpdateCrowdHeatVisuals(float CurrentHeat, float MaxHeat)
{
    if (MaxHeat <= 0.0f) return;

    VisualHeatRatio = FMath::Clamp(CurrentHeat / MaxHeat, 0.0f, 1.0f);

    // This value is bound to the dynamic material instance of the crowd momentum bar
    // Color transitions from cool (blue/neutral) to hot (orange/red) based on the ratio
    
    UE_LOG(LogTemp, Log, TEXT("Bannon UI: Crowd Heat Updated. Ratio: %f"), VisualHeatRatio);
    
    // Notify Blueprint to play pulse animation if heat > 80%
    if (VisualHeatRatio > 0.8f)
    {
        // Trigger pulse animation logic for high momentum
    }
}
