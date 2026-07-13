// Copyright BANNON.
#include "BannonReferee.h"
#include "BannonBridge.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_referee.h"
THIRD_PARTY_INCLUDES_END

using namespace BannonBridge;

ABannonReferee::ABannonReferee() { PrimaryActorTick.bCanEverTick = true; }

void ABannonReferee::Tick(float Dt)
{
	Super::Tick(Dt);
	if (DownTimer > 0.f) DownTimer = FMath::Max(0.f, DownTimer - Dt);
}

bool ABannonReferee::HasLineOfSight(FVector ShoulderMid, const TArray<FVector>& Occluders) const
{
	bannon::Vec3 eye = ToNative(GetActorLocation() + FVector(0, 0, 155));   // ~head height
	bannon::Vec3 facing = ToNative(GetActorForwardVector());
	bannon::Vec3 shoulders = ToNative(ShoulderMid);
	TArray<bannon::Vec3> occ; occ.Reserve(Occluders.Num());
	for (const FVector& O : Occluders) occ.Add(ToNative(O));
	return bannon::refHasLineOfSight(eye, facing, shoulders, occ.GetData(), occ.Num());
}

FVector ABannonReferee::AvoidanceVelocity(FVector MoverPos, FVector MoverVel) const
{
	bannon::Vec3 v = bannon::refAvoidanceVelocity(ToNative(GetActorLocation()), ToNative(MoverPos), ToNative(MoverVel));
	return ToUE(v);
}

float ABannonReferee::Bump(float ImpactVel)
{
	// the ref's own small pool lives across calls; keep it on the actor via a static-like member proxy.
	static bannon::RefState S;   // one ref per match; a multi-ref match would key this per-actor
	float down = bannon::refBump(S, ImpactVel);
	if (down > 0.f) DownTimer = down;
	return down;
}
