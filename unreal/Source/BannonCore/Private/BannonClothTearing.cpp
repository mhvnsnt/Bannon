#include "BannonClothTearing.h"

void UBannonClothTearing::EvaluateClothStress(float GrappleTension, float ClothDurability, bool& bIsTorn)
{
    // Cloth Tearing & Simulation: Attire stretches and rips based on grapple constraint tension
    // When tension exceeds structural durability, triggers material swap or Chaos cloth destruction
    if (GrappleTension > (ClothDurability * 10.0f))
    {
        bIsTorn = true; 
    }
}
