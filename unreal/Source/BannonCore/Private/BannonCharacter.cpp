// AI ORIENTATION BLOCK v114
#include "BannonCharacter.h"
#include "BannonCombatAnimator.h"
#include "BannonGNMBalancer.h"
#include "BannonSoftBodyDynamics.h"
#include "BannonHairDynamics.h"
#include "BannonDNAParser.h"
#include "Components/SkeletalMeshComponent.h"

ABannonCharacter::ABannonCharacter() {
    PrimaryActorTick.bCanEverTick = true;
    
    CombatAnimator = CreateDefaultSubobject<UBannonCombatAnimator>(TEXT("CombatAnimator"));
    GNMBalancer = CreateDefaultSubobject<UBannonGNMBalancer>(TEXT("GNMBalancer"));
    SoftBodyDynamics = CreateDefaultSubobject<UBannonSoftBodyDynamics>(TEXT("SoftBodyDynamics"));
    HairDynamics = CreateDefaultSubobject<UBannonHairDynamics>(TEXT("HairDynamics"));
    DNAParser = CreateDefaultSubobject<UBannonDNAParser>(TEXT("DNAParser"));
}

void ABannonCharacter::BeginPlay() {
    Super::BeginPlay();
    if (HairDynamics && GetMesh()) {
        HairDynamics->RegisterHairStrands(GetMesh());
    }
}

void ABannonCharacter::ApplyHit(const FHitResult& Hit, float RawDamage) {
    bannon::PhysicsLaws::ApplyDamage(Health, RawDamage, Poise);
    
    FVector UnrealVel = GetVelocity();
    bannon::Vec3 NativeVel = { static_cast<float>(UnrealVel.X), static_cast<float>(UnrealVel.Y), static_cast<float>(UnrealVel.Z) };
    bannon::PhysicsLaws::EnforceVelocity(NativeVel);
    
    if (Poise.crumpleActive && GetMesh()) {
        GetMesh()->SetAllBodiesBelowSimulatePhysics(Hit.BoneName, true, true);
    }

    CurrentHitStop.durationFrames = (RawDamage > 50.0f) ? 5.0f : 3.0f;
}

void ABannonCharacter::UpdateMorph(float Torso, float Neck) {
    Poise.max = bannon::PhysicsLaws::RecalcPoiseFromMorph(Torso, Neck);
}
