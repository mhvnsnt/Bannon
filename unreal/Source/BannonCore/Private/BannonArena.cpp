// Copyright BANNON.
#include "BannonArena.h"
#include "BannonBridge.h"
#include "Components/StaticMeshComponent.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_universe.h"
THIRD_PARTY_INCLUDES_END

ABannonArena::ABannonArena()
{
	PrimaryActorTick.bCanEverTick = false;
	Deck = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Deck"));
	RootComponent = Deck;
}

float ABannonArena::PostImpact(int32 PostIndex, FVector BodyVel, FVector /*BodyPos*/) const
{
	// velocity toward the post (cm/s) -> m/s, capped, through DMG_SCALE (matches the web v153 env law).
	const float speed = BodyVel.Size() / BannonBridge::UE_M;
	const float v = FMath::Min(speed, bannon::MAX_BODY_VEL);
	if (v < 1.9f) return 0.f;               // too soft to register
	return v * bannon::DMG_SCALE * 1.4f;    // steel post is a hard surface
}

bool ABannonArena::TableImpact(float VictimMassKg, float DownVelY, float& OutPoiseShock, float& OutSpineDamage) const
{
	bannon::TableImpact r = bannon::tableImpact(VictimMassKg, DownVelY / BannonBridge::UE_M);
	OutPoiseShock = r.poiseShock; OutSpineDamage = r.spineDamage;
	return r.shattered;
}
