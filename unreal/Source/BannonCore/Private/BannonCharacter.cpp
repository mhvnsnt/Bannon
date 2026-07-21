#include "BannonCharacter.h"
#include "BannonCombatAnimator.h"
#include "BannonGNMBalancer.h"
#include "BannonSoftBodyDynamics.h"
#include "BannonHairDynamics.h"
#include "BannonDNAParser.h"
#include "Components/SkeletalMeshComponent.h"

ABannonCharacter::ABannonCharacter() {
    PrimaryActorTick.bCanEverTick = true;
    
    // Natively binding all specialized engine components directly to the base character class.
    CombatAnimator = CreateDefaultSubobject<UBannonCombatAnimator>(TEXT("CombatAnimator"));
    GNMBalancer = CreateDefaultSubobject<UBannonGNMBalancer>(TEXT("GNMBalancer"));
    SoftBodyDynamics = CreateDefaultSubobject<UBannonSoftBodyDynamics>(TEXT("SoftBodyDynamics"));
    HairDynamics = CreateDefaultSubobject<UBannonHairDynamics>(TEXT("HairDynamics"));
    DNAParser = CreateDefaultSubobject<UBannonDNAParser>(TEXT("DNAParser"));
}

void ABannonCharacter::BeginPlay() {
    Super::BeginPlay();
    
    // Global Linkage Initialization Hooks
    if (HairDynamics && GetMesh()) {
        HairDynamics->RegisterHairStrands(GetMesh());
    }
}
