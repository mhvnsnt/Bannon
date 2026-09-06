// Copyright BANNON.
// Crowd reaction driven by combat telemetry, not scripted beats — the same law as the web build:
// pops scale on real impact velocity, botches draw heat. Native crowdReaction (bannon_universe.h).
// Rendering is an Instanced/Niagara crowd (set up in BP); this component turns kinetic events into a
// pop intensity that drives the visual/audio.
//
// Two things the first pass did not have, and a real crowd needs:
//
//  1. THE BOWL IS NOT ONE NUMBER. A dive into the front row three metres away should be loudest in
//     that section and barely register across the arena. Heat is tracked PER SECTION around the ring
//     and falls off with distance from where the thing actually happened, so the instancer can drive
//     each stand separately and the audio can pan.
//
//  2. A MATCH HAS AN ARC. An instantaneous pop spikes and decays in about a second; a crowd's
//     INVESTMENT builds slowly across a whole match and bleeds slowly. Those are different signals,
//     and collapsing them into one value is why a crowd reads as a slot machine — loud, silent,
//     loud, silent, with no memory of the twenty minutes it just watched. Investment climbs on
//     sustained action and bleeds through a rest hold, which is the actual shape of a wrestling crowd.
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCrowd.generated.h"

UENUM(BlueprintType)
enum class EBannonCrowdEvent : uint8 { WeaponImpact, HighArcThrow, BotchOrStall, DynamicPin, None };

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCrowd : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonCrowd();

	// smoothed instantaneous excitement 0..1 (drives a Niagara emitter rate / audio gain in BP).
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Crowd") float Excitement = 0.2f;

	// slow-moving INVESTMENT 0..1 — how much this crowd cares about this match. Rises with sustained
	// action and big moments, bleeds through stalling. This is what should drive the ambient bed and
	// how willing they are to pop at all.
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Crowd") float Investment = 0.25f;

	// per-section heat around the bowl; index 0 faces +X, running counter-clockwise.
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Crowd") TArray<float> SectionHeat;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Crowd") int32 SectionCount = 8;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Crowd") float IdleExcitement = 0.2f;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Crowd") float ExcitementDecay = 0.4f;   // fast
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Crowd") float InvestmentDecay = 0.035f; // slow
	// how far a pop carries. Past this the far side of the bowl only hears it through the room.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Crowd") float PopFalloff = 1400.f;      // cm

	// feed a kinetic event; returns the pop intensity (-10..10, negative = heat). Updates Excitement
	// and Investment and lights the whole bowl evenly — use ReactAt when you know WHERE it happened.
	UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
	int32 React(EBannonCrowdEvent Event, float ImpactVel);

	// the spatial version: the section nearest WorldPos takes the pop, the rest get it scaled by
	// distance. A dive into the crowd or a table spot at ringside should call this.
	UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
	int32 ReactAt(EBannonCrowdEvent Event, float ImpactVel, FVector WorldPos);

	// tell the crowd whether the match is DOING anything. Feed the frame's total impact energy;
	// sustained action builds investment, a long nothing bleeds it. Call once per frame.
	UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
	void FeedAction(float Dt, float FrameImpactEnergy);

	UFUNCTION(BlueprintPure, Category="Bannon|Crowd")
	float GetSectionHeat(int32 Index) const;

	// section index for a world position, so BP can light the right stand.
	UFUNCTION(BlueprintPure, Category="Bannon|Crowd")
	int32 SectionForPosition(FVector WorldPos) const;

	// what an audio bus or emitter should actually use: the pop riding on top of the bed.
	UFUNCTION(BlueprintPure, Category="Bannon|Crowd")
	float GetOverallLoudness() const { return FMath::Clamp(Investment * 0.55f + Excitement * 0.65f, 0.f, 1.f); }

	UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
	void ResetForMatch();

	virtual void BeginPlay() override;
	virtual void TickComponent(float Dt, ELevelTick, FActorComponentTickFunction*) override;

private:
	void EnsureSections();
	void ApplyPop(int32 Pop, const FVector* At);

	float QuietTime = 0.f;
};
