#include "BannonMetaHumanDamage.h"

void UBannonMetaHumanDamage::UpdateFacialMorphs(float HeadTrauma, float& OutEyeSwelling, float& OutJawDisplacement)
{
    // MetaHuman Face Rig Damage: Procedurally displace facial bones/morph targets based on trauma
    // Applies dynamic visual swelling that corresponds directly to the physics engine damage models
    OutEyeSwelling = FMath::Clamp(HeadTrauma / 1000.0f, 0.0f, 1.0f);
    OutJawDisplacement = FMath::Clamp(HeadTrauma / 1500.0f, 0.0f, 1.0f);
}
