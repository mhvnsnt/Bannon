// Copyright BANNON.
#include "BannonFighter.h"
#include "BannonBridge.h"

ABannonFighter::ABannonFighter(){	PrimaryActorTick.bCanEverTick = true;	HP = bannon::MAX_HP; Poise = 100.0f; Stamina = bannon::MAX_STAMINA;}

void ABannonFighter::ApplyImpact(float Impact){	
    // Damage accumulation & Stun
    if (Impact > 50.0f) HeadCut = FMath::Min(1.0f, HeadCut + 0.1f);
    else if (Impact > 20.0f) TorsoBruise = FMath::Min(1.0f, TorsoBruise + 0.05f);
    
    StunMeter = FMath::Min(100.0f, StunMeter + (Impact * 0.35f));
    if (StunMeter >= 100.0f) { bIsStunned = true; StunMeter = 0.0f; }
    
    HP    = FMath::Max(0.0f, HP - Impact * bannon::DMG_SCALE);
    Poise = FMath::Max(0.0f, Poise - Impact * 2.0f);
    if (Poise <= 0.0f) bCrumpled = true;
}

void ABannonFighter::RegenStamina(bool bIdle, float Dt){	const float Rate = (bIdle ? 30.0f : 12.0f) * Dt;   Stamina = FMath::Min(bannon::MAX_STAMINA, Stamina + Rate);	if (bCrumpled && Poise <= 0.0f) Poise = FMath::Min(100.0f, Poise + 8.0f * Dt);	if (Poise > 35.0f) bCrumpled = false;}

void ABannonFighter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    if (StunMeter > 0 && !bIsStunned) StunMeter = FMath::Max(0.0f, StunMeter - (8.0f * DeltaTime));
    if (ReversalWindow > 0) ReversalWindow -= DeltaTime;
    if (bIsSubmitting) UpdateSubmission(DeltaTime);
}

void ABannonFighter::InitLockup(ABannonFighter* Target){ }
void ABannonFighter::UpdateLockup(ABannonFighter* Target, float Dt){ }

void ABannonFighter::InitSubmission(ABannonFighter* Target)
{
    bIsSubmitting = true;
    SubmissionProgress = 50.0f;
}

void ABannonFighter::UpdateSubmission(float Dt)
{
    SubmissionProgress += (FMath::RandRange(-2.0f, 2.0f));
    SubmissionProgress = FMath::Clamp(SubmissionProgress, 0.0f, 100.0f);
    if (SubmissionProgress >= 100.0f || SubmissionProgress <= 0.0f) bIsSubmitting = false;
}

void ABannonFighter::TransitionGroundPosition(FName NewPosition)
{
    GroundPosition = NewPosition;
}

void ABannonFighter::ExecuteReversal(FName ReversalType)
{
    // Breaker, Block, Dodge, Mid-move logic
    if (ReversalType == "Breaker") { /* Logic */ }
    else if (ReversalType == "Block") { /* Logic */ }
    else if (ReversalType == "Dodge") { /* Logic */ }
    else if (ReversalType == "MidMove") { /* Logic */ }
}
