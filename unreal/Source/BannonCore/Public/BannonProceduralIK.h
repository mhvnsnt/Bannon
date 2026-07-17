// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonProceduralIK.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralIK : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonProceduralIK();

	// Procedural Hand IK attachment for picking up objects
	UFUNCTION(BlueprintCallable, Category="Bannon|IK")
	void AttachWeaponGrip(class AActor* Weapon, FName HandBoneName);

	// Triggers ragdoll only on a specific limb (e.g. dead leg)
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void TriggerLimbRagdoll(FName LimbRootBone);
};
