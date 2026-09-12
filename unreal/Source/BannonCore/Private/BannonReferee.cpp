// Copyright BANNON.
#include "BannonReferee.h"
#include "BannonBridge.h"

using namespace BannonBridge;

ABannonReferee::ABannonReferee()
{
	PrimaryActorTick.bCanEverTick = true;
}

void ABannonReferee::Tick(float Dt)
{
	Super::Tick(Dt);
	if (DownTimer > 0.f)
	{
		DownTimer = FMath::Max(0.f, DownTimer - Dt);
		if (DownTimer <= 0.f)
		{
			// he comes to with a shaken pool, not a fresh one — a second bump in the same match
			// should floor him faster than the first, which is what refBump's draining pool gives us.
			RefPool.down = false;
			RefPool.poise = FMath::Max(RefPool.poise, 12.f);
		}
	}
}

bool ABannonReferee::HasLineOfSight(FVector ShoulderMid, const TArray<FVector>& Occluders) const
{
	const bannon::Vec3 Eye = ToNative(GetActorLocation() + FVector(0, 0, 155));   // ~head height
	const bannon::Vec3 Facing = ToNative(GetActorForwardVector());
	const bannon::Vec3 Shoulders = ToNative(ShoulderMid);

	TArray<bannon::Vec3> Occ;
	Occ.Reserve(Occluders.Num());
	for (const FVector& O : Occluders)
	{
		Occ.Add(ToNative(O));
	}
	return bannon::refHasLineOfSight(Eye, Facing, Shoulders, Occ.GetData(), Occ.Num());
}

FVector ABannonReferee::AvoidanceVelocity(FVector MoverPos, FVector MoverVel) const
{
	const bannon::Vec3 V = bannon::refAvoidanceVelocity(
		ToNative(GetActorLocation()), ToNative(MoverPos), ToNative(MoverVel));
	return ToUE(V);
}

float ABannonReferee::Bump(float ImpactVel)
{
	const float Down = bannon::refBump(RefPool, ImpactVel);
	if (Down > 0.f)
	{
		DownTimer = Down;
		StopCount();                       // a floored referee is not counting anything
		OnBumped.Broadcast(Down);
	}
	return Down;
}

float ABannonReferee::CheckBump(FVector BodyPos, FVector BodyVel)
{
	if (DownTimer > 0.f)
	{
		return 0.f;                        // already down; you cannot bump a man on the mat
	}
	const FVector Delta = BodyPos - GetActorLocation();
	if (FVector::DistSquared2D(BodyPos, GetActorLocation()) > ContactRadius * ContactRadius)
	{
		return 0.f;
	}
	const float Speed = BodyVel.Size2D();
	if (Speed < BumpMinSpeed)
	{
		return 0.f;                        // walked into him — that is a nudge, not a bump
	}
	return Bump(Speed / UE_M);             // native laws are metres/second
}

void ABannonReferee::StartCount()
{
	bCounting = true;
	Count = 0;
	CountTimer = 0.f;
	bHeldLastFrame = false;
}

void ABannonReferee::StopCount()
{
	bCounting = false;
	Count = 0;
	CountTimer = 0.f;
	bHeldLastFrame = false;
}

int32 ABannonReferee::TickCount(float Dt, FVector ShoulderMid, const TArray<FVector>& Occluders)
{
	if (!bCounting)
	{
		return 0;
	}

	// THE LAW: the count advances only while he is up AND the shoulders are genuinely in his sight.
	// Bump him or stand in front of him and the count HOLDS — it does not slow down, it stops. That
	// is the whole reason the referee is a physical entity instead of a timer.
	const bool bCanCount = CanCount(ShoulderMid, Occluders);
	if (!bCanCount)
	{
		if (!bHeldLastFrame)
		{
			bHeldLastFrame = true;
			OnCountHeld.Broadcast(IsDown());
		}
		return Count;
	}
	bHeldLastFrame = false;

	CountTimer += Dt;
	if (CountTimer >= CountInterval)
	{
		CountTimer -= CountInterval;
		++Count;
		OnCount.Broadcast(Count);
		if (Count >= 3)
		{
			bCounting = false;
		}
	}
	return Count;
}

void ABannonReferee::UpdatePositioning(float Dt, const TArray<FVector>& Bodies, const TArray<FVector>& BodyVels, bool bCovering)
{
	if (Dt <= 0.f || Bodies.Num() == 0)
	{
		return;
	}
	if (DownTimer > 0.f)
	{
		return;                            // he is on the mat; he is not repositioning
	}

	// ideal spot: stood off the midpoint of the action so both men are inside the cone. On a cover he
	// closes in and drops, which is also when his sightline matters most.
	FVector Mid = FVector::ZeroVector;
	for (const FVector& B : Bodies)
	{
		Mid += B;
	}
	Mid /= static_cast<float>(Bodies.Num());

	FVector Out = Mid - GetActorLocation();
	Out.Z = 0.f;
	const float OutLen = Out.Size();
	FVector Radial = (OutLen > KINDA_SMALL_NUMBER) ? (Out / OutLen) : FVector(1.f, 0.f, 0.f);

	const float Ring = bCovering ? StandOff * 0.55f : StandOff;
	FVector Target = Mid - Radial * Ring;

	// stay inside the ropes — a referee backed through the ropes is a bug, not officiating
	Target.X = FMath::Clamp(Target.X, -RingHalfExtent + 40.f, RingHalfExtent - 40.f);
	Target.Y = FMath::Clamp(Target.Y, -RingHalfExtent + 40.f, RingHalfExtent - 40.f);
	Target.Z = GetActorLocation().Z;

	// PREDICTIVE AVOIDANCE OVERRIDES THE TARGET. A whip coming through where he is standing is more
	// urgent than good positioning, and the native law steps him PERPENDICULAR to the travel line
	// rather than backpedalling down it (which is how you get run over).
	const int32 N = FMath::Min(Bodies.Num(), BodyVels.Num());
	for (int32 i = 0; i < N; ++i)
	{
		const FVector Escape = AvoidanceVelocity(Bodies[i], BodyVels[i]);
		if (!Escape.IsNearlyZero())
		{
			Target = GetActorLocation() + Escape;
			Target.X = FMath::Clamp(Target.X, -RingHalfExtent + 40.f, RingHalfExtent - 40.f);
			Target.Y = FMath::Clamp(Target.Y, -RingHalfExtent + 40.f, RingHalfExtent - 40.f);
			Target.Z = GetActorLocation().Z;
			break;
		}
	}

	// jog, capped. Refs do not sprint (the native avoidance clamps to 0.7 * MAX_BODY_VEL for the same
	// reason); a referee who teleports to the perfect spot reads as fake.
	FVector Move = Target - GetActorLocation();
	Move.Z = 0.f;
	const float Dist = Move.Size();
	if (Dist > 3.f)
	{
		const float Step = FMath::Min(JogSpeed * Dt, Dist);
		SetActorLocation(GetActorLocation() + Move / Dist * Step, true);
	}

	// face the action, so the LoS cone is pointed at what he is supposed to be watching
	FVector Look = Mid - GetActorLocation();
	Look.Z = 0.f;
	if (!Look.IsNearlyZero())
	{
		const FRotator Want = Look.Rotation();
		SetActorRotation(FMath::RInterpTo(GetActorRotation(), Want, Dt, 6.f));
	}
}

void ABannonReferee::ResetForMatch()
{
	RefPool = bannon::RefState();          // fresh HP + poise, not the last match's leftovers
	DownTimer = 0.f;
	StopCount();
}
