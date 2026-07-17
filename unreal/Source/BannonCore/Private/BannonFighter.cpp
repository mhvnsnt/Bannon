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
