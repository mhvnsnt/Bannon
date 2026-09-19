#include "BannonAlignmentShift.h"

void UBannonAlignmentShift::ProcessAlignmentAction(bool bUsedWeapon, bool bAttackedRef, float CurrentAlignment, float& NewAlignment, bool& bTurnOccurred)
{
    // -100 = Pure Heel, 100 = Pure Face
    NewAlignment = CurrentAlignment;
    bTurnOccurred = false;

    if (bUsedWeapon) NewAlignment -= 20.0f;
    if (bAttackedRef) NewAlignment -= 50.0f;

    // Clamp alignment
    NewAlignment = FMath::Clamp(NewAlignment, -100.0f, 100.0f);

    // Check for Heel Turn (crossing from positive to negative)
    if (CurrentAlignment >= 0.0f && NewAlignment < 0.0f)
    {
        bTurnOccurred = true;
    }
}
