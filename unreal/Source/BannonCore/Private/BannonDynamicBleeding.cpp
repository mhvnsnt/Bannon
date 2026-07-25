#include "BannonDynamicBleeding.h"

void UBannonDynamicBleeding::ProcessBloodTransfer(float BleedingSeverity, bool bIsGrappling, float ImpactForce, float& OutCanvasPoolDecalSize, float& OutOpponentBloodTransferAmount)
{
    // Translates high laceration damage into visual consequences
    if (BleedingSeverity > 50.0f)
    {
        // When taking a bump, the force squeezes blood onto the canvas
        OutCanvasPoolDecalSize = (BleedingSeverity * 0.5f) + (ImpactForce * 0.05f);

        // If grappling while bleeding heavily, the blood transfers to the opponent's material mask
        if (bIsGrappling)
        {
            OutOpponentBloodTransferAmount = BleedingSeverity * 0.15f; 
        }
        else
        {
            OutOpponentBloodTransferAmount = 0.0f;
        }
    }
    else
    {
        OutCanvasPoolDecalSize = 0.0f;
        OutOpponentBloodTransferAmount = 0.0f;
    }
}
