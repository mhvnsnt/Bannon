// Copyright BANNON.
// The referee as a physical actor. Ports bannon_referee.h: LoS-gated pin counts (view cone + body
// occlusion), lateral whip avoidance, and real ref bumps (own HP/poise pool). The count only
// advances while CanCount() is true — a bumped or sight-blocked ref holds the count, same law the
// web BANNON_REF entity runs.
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "BannonReferee.generated.h"

UCLASS()
class BANNONCORE_API ABannonReferee : public ACharacter
{
	GENERATED_BODY()

public:
	ABannonReferee();

	UPROPERTY(BlueprintReadOnly, Category="Bannon|Ref") float DownTimer = 0.f;   // >0 = bumped, no counting

	// clear sightline to the pinned wrestler's shoulders? (view cone + other-body occlusion). Feed the
	// occluder positions (other fighters). Uses native refHasLineOfSight.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	bool HasLineOfSight(FVector ShoulderMid, const TArray<FVector>& Occluders) const;

	// may the count advance right now? (up AND has LoS).
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	bool CanCount(FVector ShoulderMid, const TArray<FVector>& Occluders) const { return DownTimer <= 0.f && HasLineOfSight(ShoulderMid, Occluders); }

	// lateral escape velocity out of an incoming whip/carry (native refAvoidanceVelocity).
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	FVector AvoidanceVelocity(FVector MoverPos, FVector MoverVel) const;

	// a fast body contacts the ref -> he goes down, counts suspend (native refBump). Returns seconds down.
	UFUNCTION(BlueprintCallable, Category="Bannon|Ref")
	float Bump(float ImpactVel);

	virtual void Tick(float Dt) override;
};
