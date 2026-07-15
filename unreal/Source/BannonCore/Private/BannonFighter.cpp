// Copyright BANNON.
#include "BannonFighter.h"
#include "BannonBridge.h"

ABannonFighter::ABannonFighter()
{
	PrimaryActorTick.bCanEverTick = true;
	HP = bannon::MAX_HP; Poise = 100.0f; Stamina = bannon::MAX_STAMINA;
}

void ABannonFighter::ApplyImpact(float Impact)
{
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
}
