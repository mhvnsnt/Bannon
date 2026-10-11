#include "BannonProceduralReversals.h"

void UBannonProceduralReversals::CalculateReversalWindow(float AttackerVelocity, float DefenderAgility, float& OutWindowMs)
{
    // The faster the attacker is moving (e.g., a running strike), the smaller the reversal window.
    // However, a highly agile defender gets a wider window.
    float BaseWindow = 300.0f; // 300 milliseconds base
    
    float VelocityPenalty = AttackerVelocity * 0.2f; // Fast attacks shrink the window
    float AgilityBonus = DefenderAgility * 2.0f; // Agile defenders expand the window
    
    OutWindowMs = BaseWindow - VelocityPenalty + AgilityBonus;
    
    // Clamp to ensure it's humanly possible but not infinitely easy
    OutWindowMs = FMath::Clamp(OutWindowMs, 50.0f, 600.0f);
}
