// Copyright BANNON.

#include "BannonFighter.h"
#include "BannonBridge.h"
#include "BannonRagdollComponent.h"
#include "BannonGrappleGrip.h"
#include "Components/SkeletalMeshComponent.h"

ABannonFighter::ABannonFighter()
{
	PrimaryActorTick.bCanEverTick = true;
	HP = bannon::MAX_HP; Poise = 100.0f; Stamina = bannon::MAX_STAMINA;

	// assemble the physical body: active-ragdoll driver + grapple grip (both ActorComponents).
	Ragdoll = CreateDefaultSubobject<UBannonRagdollComponent>(TEXT("Ragdoll"));
	Grip    = CreateDefaultSubobject<UBannonGrappleGrip>(TEXT("GrappleGrip"));
}

bool ABannonFighter::GrappleGrab(ABannonFighter* Victim, FName HandSocket)
{
	if (!Victim || !Grip) return false;

	USkeletalMeshComponent* VMesh = Victim->GetMesh();
	USkeletalMeshComponent* AMesh = GetMesh();
	if (!VMesh || !AMesh) return false;

	// the victim must be simulating for a physical catch — pop its ragdoll blend up first.
	if (Victim->Ragdoll) Victim->Ragdoll->ImpactBlend(1.0f);
	VMesh->SetAllBodiesBelowSimulatePhysics(FName(TEXT("Hips")), true, true);

	const FVector HandPos = AMesh->DoesSocketExist(HandSocket)
		? AMesh->GetSocketLocation(HandSocket) : AMesh->GetComponentLocation();
	return Grip->GripNearest(VMesh, HandPos);
}

void ABannonFighter::ApplyImpact(float Impact)
{
    // Damage accumulation & Stun
    if (Impact > 50.0f) HeadCut = FMath::Min(1.0f, HeadCut + 0.1f);
    else if (Impact > 20.0f) TorsoBruise = FMath::Min(1.0f, TorsoBruise + 0.05f);
    
    StunMeter = FMath::Min(100.0f, StunMeter + (Impact * 0.35f));
    if (StunMeter >= 100.0f) { bIsStunned = true; StunMeter = 0.0f; }
    
	// poise-driven crumple, independent of HP (mirrors native applyImpact). Poise breaks first;
	// crumple latches off poise, never off HP.
	HP    = FMath::Max(0.0f, HP - Impact * bannon::DMG_SCALE);
	Poise = FMath::Max(0.0f, Poise - Impact * 2.0f);
	if (Poise <= 0.0f) bCrumpled = true;
}

void ABannonFighter::RegenStamina(bool bIdle, float Dt)
{
	const float Rate = (bIdle ? 30.0f : 12.0f) * Dt;   // idle recovers faster
	Stamina = FMath::Min(bannon::MAX_STAMINA, Stamina + Rate);
	if (bCrumpled && Poise <= 0.0f) Poise = FMath::Min(100.0f, Poise + 8.0f * Dt);
	if (Poise > 35.0f) bCrumpled = false;
}

void ABannonFighter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    if (StunMeter > 0 && !bIsStunned) StunMeter = FMath::Max(0.0f, StunMeter - (8.0f * DeltaTime));
    if (ReversalWindow > 0) ReversalWindow -= DeltaTime;
    if (bIsSubmitting) UpdateSubmission(DeltaTime);
}

void ABannonFighter::InitLockup(ABannonFighter* Target) 
{ 
    // Trigger physical IK lockup blending if valid target
    if (Target) {
        // Physical resistance simulation based on target mass
        Poise -= (Target->StrikeMass * 2.0f); 
    }
}

void ABannonFighter::UpdateLockup(ABannonFighter* Target, float Dt) 
{ 
    // Drain stamina during physical tie-up based on mass delta
    if (Target && Stamina > 0.0f) {
        float MassDelta = FMath::Max(0.0f, Target->StrikeMass - StrikeMass);
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
    if (SubmissionProgress >= 100.0f || SubmissionProgress <= 0.0f) {
        bIsSubmitting = false;
        // On submission break, apply massive poise damage to the loser
        if (SubmissionProgress <= 0.0f) {
            Poise = 0.0f; 
            bCrumpled = true;
        }
    }
}

void ABannonFighter::TransitionGroundPosition(FName NewPosition)
{
    GroundPosition = NewPosition;
}

void ABannonFighter::ExecuteReversal(FName ReversalType)
{
    // Mass-driven reversal dynamics. If we're caught in a grip, break it.
    if (ReversalType == "Breaker") { 
        if (Grip && Grip->IsGripping()) {
            Grip->ReleaseGrip();
        }
        // Apply an outward impulse via ragdoll logic if grabbed
        if (Ragdoll) {
            Ragdoll->ApplyReversalImpulse(FVector::UpVector * 500.0f + GetActorForwardVector() * 250.0f);
        }
        Poise = FMath::Min(100.0f, Poise + 20.0f);
    }
    else if (ReversalType == "Block") { 
        // Rigid body posture lock
        if (Ragdoll) Ragdoll->SetJointStiffness(1.0f); // Max stiffness for impact absorption
        Poise += 10.0f;
    }
    else if (ReversalType == "Dodge") { 
        // Lower hitbox profile via physics blend
        if (Ragdoll) Ragdoll->ImpactBlend(0.2f);
        Stamina = FMath::Max(0.0f, Stamina - 15.0f);
    }
    else if (ReversalType == "MidMove") { 
        // Desperation mid-air ragdoll shift to alter center of mass
        if (Ragdoll) Ragdoll->ShiftCenterOfMass(FVector(0.0f, 0.0f, -50.0f));
    }
}
