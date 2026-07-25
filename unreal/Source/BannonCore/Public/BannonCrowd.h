// Copyright BANNON.
// Crowd reaction driven by combat telemetry, not scripted beats — the same law as the web build:
// pops scale on real impact velocity, botches draw heat. Native crowdReaction (bannon_universe.h).
// Rendering is an Instanced/Niagara crowd (set up in BP); this component turns kinetic events into a
// pop intensity that drives the visual/audio.
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
	// smoothed excitement 0..1 (drives a Niagara emitter rate / audio gain in BP).
	UPROPERTY(BlueprintReadOnly, Category="Bannon|Crowd") float Excitement = 0.2f;

	// feed a kinetic event; returns the pop intensity (-10..10, negative = heat). Updates Excitement.
	UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
	int32 React(EBannonCrowdEvent Event, float ImpactVel);

	virtual void TickComponent(float Dt, ELevelTick, FActorComponentTickFunction*) override;
	UBannonCrowd() { PrimaryComponentTick.bCanEverTick = true; }
};
