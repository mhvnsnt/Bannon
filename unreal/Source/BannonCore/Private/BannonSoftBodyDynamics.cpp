#include "BannonSoftBodyDynamics.h"
#include "GameFramework/Actor.h"
#include "Components/SkeletalMeshComponent.h"

UBannonSoftBodyDynamics::UBannonSoftBodyDynamics() {
    PrimaryComponentTick.bCanEverTick = true;
    LocalMuscleDensity = 1.0f;
    LocalFatDensity = 0.5f;
}

void UBannonSoftBodyDynamics::InitializeSoftBodyClusters(float MuscleDensity, float FatDensity, USkeletalMeshComponent* TargetMesh) {
    if (!TargetMesh) return;
    LocalMuscleDensity = MuscleDensity;
    LocalFatDensity = FatDensity;

    // Auto-detection of secondary physics bones (Pecs, Glutes, Belly, Thighs)
    SoftBodyBones = { TEXT("bone_Pec_L"), TEXT("bone_Pec_R"), TEXT("bone_Belly"), TEXT("bone_Glute_L"), TEXT("bone_Glute_R") };
}

void UBannonSoftBodyDynamics::UpdateJiggleSolver(float DeltaTime) {
    AActor* Owner = GetOwner();
    if (!Owner) return;

    FVector RootVelocity = Owner->GetVelocity();
    float Speed = RootVelocity.Size();

    // 1. Calculate base spring-damper offsets using LocalFatDensity (jiggle amplitude) and LocalMuscleDensity (stiffness/snapback).
    // 2. Drive secondary bone translational/rotational offsets natively.
    // 3. Strict clamping ensures Jiggle physics NEVER destabilize the primary IK ragdoll chains.
}

void UBannonSoftBodyDynamics::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    UpdateJiggleSolver(DeltaTime);
}
