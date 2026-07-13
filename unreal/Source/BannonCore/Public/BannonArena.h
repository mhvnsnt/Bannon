// Copyright BANNON.
// The arena: elevated ring deck + 4 posts + turnbuckles + verlet-style ropes + the bowl/crowd. Meshes
// come from the Tripo environment set (assets/reference/env_snapshots seeds) as Static/Skeletal meshes;
// ring-post/step/table impacts are live surfaces (native env-contact + tableImpact laws). Ropes stay a
// lightweight physics constraint chain (the one thing kept procedural, like the web verlet ropes).
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BannonArena.generated.h"

class UStaticMeshComponent;

UCLASS()
class BANNONCORE_API ABannonArena : public AActor
{
	GENERATED_BODY()

public:
	ABannonArena();

	UPROPERTY(VisibleAnywhere, Category="Bannon|Arena") UStaticMeshComponent* Deck = nullptr;   // elevated ring platform
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Arena") float RingHalfExtent = 350.f;  // cm, ~7m ring
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Arena") int32 RopeSegments = 24;

	// a body driven into a ring post at speed -> velocity-scaled impact damage (native env-contact law).
	// Returns damage; 0 if the hit was too soft. Post index 0..3.
	UFUNCTION(BlueprintCallable, Category="Bannon|Arena")
	float PostImpact(int32 PostIndex, FVector BodyVel, FVector BodyPos) const;

	// TLC table under a falling body: shatter past 350N -> big poise shock + localized spine damage.
	UFUNCTION(BlueprintCallable, Category="Bannon|Arena")
	bool TableImpact(float VictimMassKg, float DownVelY, float& OutPoiseShock, float& OutSpineDamage) const;
};
