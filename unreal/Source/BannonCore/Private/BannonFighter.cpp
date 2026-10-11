// Copyright BANNON.

#include "BannonFighter.h"
#include "BannonBridge.h"
#include "BannonRagdollComponent.h"
#include "BannonGrappleGrip.h"
#include "BannonALSMovementComponent.h"
#include "BannonPoseAuthorityComponent.h"
#include "Components/SkeletalMeshComponent.h"

ABannonFighter::ABannonFighter(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer.SetDefaultSubobjectClass<UBannonALSMovementComponent>(ACharacter::CharacterMovementComponentName))
{
    PrimaryActorTick.bCanEverTick = true;
    HP = bannon::MAX_HP;
    Poise = 100.0f;
    Stamina = bannon::MAX_STAMINA;

    Ragdoll = CreateDefaultSubobject<UBannonRagdollComponent>(TEXT("Ragdoll"));
    Grip = CreateDefaultSubobject<UBannonGrappleGrip>(TEXT("GrappleGrip"));
    PoseAuthority = CreateDefaultSubobject<UBannonPoseAuthorityComponent>(TEXT("PoseAuthority"));
}

bool ABannonFighter::GrappleGrab(ABannonFighter* Victim, FName HandSocket)
{
    if (!Victim || !Grip) return false;
    USkeletalMeshComponent* VMesh = Victim->GetMesh();
    USkeletalMeshComponent* AMesh = GetMesh();
    if (!VMesh || !AMesh) return false;

    if (Victim->PoseAuthority && !Victim->PoseAuthority->ClaimBone(FName(TEXT("spine_03")), EBannonPoseOwner::Grapple))
        return false;

    if (Victim->Ragdoll) Victim->Ragdoll->ImpactBlend(1.0f);
    VMesh->SetAllBodiesBelowSimulatePhysics(FName(TEXT("Hips")), true, true);

    const FVector HandPos = AMesh->DoesSocketExist(HandSocket)
        ? AMesh->GetSocketLocation(HandSocket) : AMesh->GetComponentLocation();
    return Grip->GripNearest(VMesh, HandPos);
}

void ABannonFighter::ApplyImpact(float Impact)
{
    if (Impact > 50.0f) HeadCut = FMath::Min(1.0f, HeadCut + 0.1f);
    else if (Impact > 20.0f) TorsoBruise = FMath::Min(1.0f, TorsoBruise + 0.05f);

    StunMeter = FMath::Min(100.0f, StunMeter + (Impact * 0.35f));
    if (StunMeter >= 100.0f) { bIsStunned = true; StunMeter = 0.0f; }

    HP = FMath::Max(0.0f, HP - Impact * bannon::DMG_SCALE);
    Poise = FMath::Max(0.0f, Poise - Impact * 2.0f);
    if (Poise <= 0.0f) bCrumpled = true;
}

void ABannonFighter::RegenStamina(bool bIdle, float Dt)
{
    const float Rate = (bIdle ? 30.0f : 12.0f) * Dt;
    Stamina = FMath::Min(bannon::MAX_STAMINA, Stamina + Rate);
    if (bCrumpled && Poise <= 0.0f) Poise = FMath::Min(100.0f, Poise + 8.0f * Dt);
    if (Poise > 35.0f) bCrumpled = false;
}

void ABannonFighter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (PoseAuthority)
    {
        PoseAuthority->BeginPoseFrame();
        PoseAuthority->ClaimBone(FName(TEXT("root")), EBannonPoseOwner::Locomotion);
        PoseAuthority->ClaimBone(FName(TEXT("pelvis")), EBannonPoseOwner::Locomotion);
    }

    if (UBannonALSMovementComponent* Movement = Cast<UBannonALSMovementComponent>(GetCharacterMovement()))
    {
        const FVector Input = GetLastMovementInputVector();
        Movement->CalculateWarpingStates(DeltaTime, Input, GetVelocity());
    }

    if (StunMeter > 0 && !bIsStunned) StunMeter = FMath::Max(0.0f, StunMeter - (8.0f * DeltaTime));
    if (ReversalWindow > 0) ReversalWindow -= DeltaTime;
    if (bIsSubmitting) UpdateSubmission(DeltaTime);
}

void ABannonFighter::InitLockup(ABannonFighter* Target)
{
    if (Target) Poise -= (Target->StrikeMass * 2.0f);
}

void ABannonFighter::UpdateLockup(ABannonFighter* Target, float Dt)
{
    if (Target && Stamina > 0.0f)
    {
        const float MassDelta = FMath::Max(0.0f, Target->StrikeMass - StrikeMass);
        Stamina -= (10.0f + (MassDelta * 5.0f)) * Dt;
    }
}

void ABannonFighter::InitSubmission(ABannonFighter* Target)
{
    bIsSubmitting = true;
    SubmissionProgress = 50.0f;
}

void ABannonFighter::UpdateSubmission(float Dt)
{
    SubmissionProgress += (FMath::RandRange(-2.0f, 2.0f));
    SubmissionProgress = FMath::Clamp(SubmissionProgress, 0.0f, 100.0f);
    if (SubmissionProgress >= 100.0f || SubmissionProgress <= 0.0f)
    {
        bIsSubmitting = false;
        if (SubmissionProgress <= 0.0f) { Poise = 0.0f; bCrumpled = true; }
    }
}

void ABannonFighter::TransitionGroundPosition(FName NewPosition)
{
    GroundPosition = NewPosition;
}

void ABannonFighter::ExecuteReversal(FName ReversalType)
{
    if (ReversalType == "Breaker")
    {
        if (Grip && Grip->IsGripping()) Grip->ReleaseGrip();
        if (Ragdoll) Ragdoll->ApplyReversalImpulse(FVector::UpVector * 500.0f + GetActorForwardVector() * 250.0f);
        Poise = FMath::Min(100.0f, Poise + 20.0f);
    }
    else if (ReversalType == "Block")
    {
        if (Ragdoll) Ragdoll->SetJointStiffness(1.0f);
        Poise += 10.0f;
    }
    else if (ReversalType == "Dodge")
    {
        if (Ragdoll) Ragdoll->ImpactBlend(0.2f);
        Stamina = FMath::Max(0.0f, Stamina - 15.0f);
    }
    else if (ReversalType == "MidMove")
    {
        if (Ragdoll) Ragdoll->ShiftCenterOfMass(FVector(0.0f, 0.0f, -50.0f));
    }
}
