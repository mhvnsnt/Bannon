#include "BannonMatchPsychology.h"

void UBannonMatchPsychology::CalculateMomentumShift(float DamageDealt, bool bWasSignatureMove, float& CurrentMomentum, bool& bIsOnFire)
{
    // Evaluates psychological momentum based on offensive success
    float MomentumGain = DamageDealt * 0.1f;
    
    if (bWasSignatureMove)
    {
        MomentumGain *= 2.5f; // Huge crowd reaction and confidence boost
    }
    
    CurrentMomentum += MomentumGain;
    CurrentMomentum = FMath::Clamp(CurrentMomentum, 0.0f, 100.0f);
    
    bIsOnFire = (CurrentMomentum >= 90.0f); // Triggers "Adrenaline Masking" (Hulking Up)
}
