#include "BannonAnimNotify_ImpactTaunt.h"
// #include "BannonImpactTauntSystem.h" // Links back to the system built in Phase 52

void UBannonAnimNotify_ImpactTaunt::Notify(USkeletalMeshComponent* MeshComp, UAnimSequenceBase* Animation, const FAnimNotifyEventReference& EventReference)
{
    Super::Notify(MeshComp, Animation, EventReference);
    
    // Deep UE AnimGraph Binding: 
    // This AnimNotify fires precisely when the active collision frames of a "taunt" occur.
    // For example, when the wrestler is doing a breakdance "Spinaroony" and their legs sweep the floor,
    // or when performing a Capoeira "Ginga" and the leg arcs through the hit zone.
    
    // It temporarily converts the animation bone position into a physical sphere trace (Hitbox)
    // allowing the taunt to double as a legitimate strike that utilizes the game universe physics 
    // to impart force and damage on nearby opponents.
}
