// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMedicalSystem.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMedicalSystem : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonMedicalSystem();

	// Concussion / Daze State Engine
	UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
	void ProcessHeadTrauma(float ImpactForce);

	// Adrenaline Masking (The "Hulking Up" effect)
	UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
	void TriggerAdrenalineSpike(float Momentum);

	// Dynamic Bruising Shader & Blood Transfer
	UFUNCTION(BlueprintCallable, Category="Bannon|Medical")
	void ApplyLocalizedLaceration(FName BoneName, float DamageAmount);
};
