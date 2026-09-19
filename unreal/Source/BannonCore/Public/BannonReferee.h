// Copyright BANNON.
// The referee as a physical actor. Ports bannon_referee.h: LoS-gated pin counts (view cone + body
// occlusion), lateral whip avoidance, and real ref bumps (own HP/poise pool). The count only
// advances while CanCount() is true — a bumped or sight-blocked ref holds the count, same law the
// web BANNON_REF entity runs.
//
// He is not a prop. He jogs to keep the action inside his cone, drops beside a cover, steps off the
// line of an incoming whip rather than being run through, and takes a real bump when a fast body
// reaches him. Every number below comes out of bannon_referee.h — nothing is re-derived here.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_referee.h"
THIRD_PARTY_INCLUDES_END

#include "BannonReferee.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FBannonRefCount, int32, Reached);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FBannonRefHold, bool, bRefIsDown);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FBannonRefBump, float, SecondsDown);

UCLASS()
class BANNONCORE_API ABannonReferee : public ACharacter
{
	GENERATED_BODY()

public:
	ABannonReferee();

	UPROPERTY(BlueprintReadOnly, Category="Bannon|Ref") float DownTimer = 0.f;   // >0 = bumped, no counting

	// ── COUNT ────────────────────────────────────────────────────────────────────────────────
	// 0 = no count running, 1..3 = the count reached. Driven by REAL TIME, not tick count, so a
	// frame hitch can never shorten a three.
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Ref") int32 Count = 0;
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Ref") bool  bCounting = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ref") float CountInterval = 1.5f;

	// ── MOVEMENT (refs jog; they do not sprint) ───────────────────────────────────────────────
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ref") float JogSpeed = 260.f;       // cm/s
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ref") float StandOff = 170.f;       // cm off the action
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ref") float RingHalfExtent = 350.f; // cm
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ref") float ContactRadius = 50.f;   // cm, bump contact
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Ref") float BumpMinSpeed = 190.f;   // cm/s to bump him

	UPROPERTY(BlueprintAssignable, Category="Bannon|Ref") FBannonRefCount OnCount;      // fires on 1, 2, 3
	UPROPERTY(BlueprintAssignable, Category="Bannon|Ref") FBannonRefHold  OnCountHeld;  // sight lost / ref down
	UPROPERTY(BlueprintAssignable, Category="Bannon|Ref") FBannonRefBump  OnBumped;

	// clear sightline to the pinned wrestler's shoulders? (view cone + other-body occlusion). Feed the
	// occluder positions (other fighters). Uses native refHasLineOfSight.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	bool HasLineOfSight(FVector ShoulderMid, const TArray<FVector>& Occluders) const;

	// may the count advance right now? (up AND has LoS).
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	bool CanCount(FVector ShoulderMid, const TArray<FVector>& Occluders) const { return DownTimer <= 0.f && HasLineOfSight(ShoulderMid, Occluders); }

	UFUNCTION(BlueprintPure, Category="Bannon|Ref")
	bool IsDown() const { return DownTimer > 0.f; }

	// lateral escape velocity out of an incoming whip/carry (native refAvoidanceVelocity).
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	FVector AvoidanceVelocity(FVector MoverPos, FVector MoverVel) const;

	// a fast body contacts the ref -> he goes down, counts suspend (native refBump). Returns seconds down.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	float Bump(float ImpactVel);

	// contact test + bump in one call: pass a body's position and velocity each frame. Only a body
	// genuinely ON him and genuinely moving takes him out — brushing past does not.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	float CheckBump(FVector BodyPos, FVector BodyVel);

	// start / stop a cover. StartCount resets to zero.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref") void StartCount();
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref") void StopCount();

	// drive the count for this frame. Returns the count reached (3 = the fall). Call from the match
	// manager with the pinned shoulders and the other bodies in the ring.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	int32 TickCount(float Dt, FVector ShoulderMid, const TArray<FVector>& Occluders);

	// keep him where a referee belongs: standing off the action with it inside his cone, or down on
	// the mat beside a cover. Threats override the target — he steps off the line of travel, he does
	// not backpedal into the ropes.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	void UpdatePositioning(float Dt, const TArray<FVector>& Bodies, const TArray<FVector>& BodyVels, bool bCovering);

	// fresh pool and no count carried into the next match. A persistent poise pool would mean the
	// second match of a card starts with a referee already one shove from the floor.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	void ResetForMatch();

	UFUNCTION(BlueprintPure, Category="Bannon|Ref") float GetPoise()  const { return RefPool.poise; }
	UFUNCTION(BlueprintPure, Category="Bannon|Ref") float GetHealth() const { return RefPool.hp; }

	virtual void Tick(float Dt) override;

private:
	// PER-ACTOR pool. This was a function-local `static bannon::RefState`, so every referee in the
	// process shared one HP/poise pool and it never reset: the second match of a card started with a
	// referee already half-floored by the first, and a match with two officials had them share one
	// body. State belongs on the actor.
	bannon::RefState RefPool;

	float CountTimer = 0.f;
	bool  bHeldLastFrame = false;
};
