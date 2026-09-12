// Copyright BANNON.

#include "BannonMedicalSystem.h"

UBannonMedicalSystem::UBannonMedicalSystem()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UBannonMedicalSystem::ProcessHeadTrauma(float ImpactForce)
{
	if (ImpactForce > 20000.0f) {
		// Induces physics-wobble in locomotion state machine and triggers blurred screen effect (PostProcess)
	}
}

void UBannonMedicalSystem::TriggerAdrenalineSpike(float Momentum)
{
	if (Momentum > 90.0f) {
		// Temporarily nullifies IK limping penalties and stamina drain 
	}
}

void UBannonMedicalSystem::ApplyLocalizedLaceration(FName BoneName, float DamageAmount)
{
	if (DamageAmount > 50.0f) {
		// Communicate with the material instance to update procedural bruising shader masks
		// Increase blood pooling on canvas via decals
	}
}
