#include "BannonStatMeshScaling.h"

void UBannonStatMeshScaling::CalculateBoneScaleFromStats(float StrengthStat, float AgilityStat, FVector& TorsoScale, FVector& LimbScale)
{
    // MDickie's unique character creation logic: 
    // Stats directly deform the skeletal mesh (Strength makes you wider/thicker, Agility makes you thinner)
    
    // Assuming stats are 1-99
    float StrNorm = StrengthStat / 50.0f; // 50 is base (1.0 scale)
    float AgiNorm = AgilityStat / 50.0f;
    
    // High strength expands torso X/Y, high agility thins out limbs
    TorsoScale = FVector(StrNorm, StrNorm, 1.0f);
    
    // Agility thins you out for speed, Strength thickens limbs
    float LimbThickness = (StrNorm * 0.7f) + ((2.0f - AgiNorm) * 0.3f); 
    LimbScale = FVector(LimbThickness, LimbThickness, 1.0f);
}
