// Copyright BANNON.

#include "BannonPhysicsCollider.h"

UBannonPhysicsCollider::UBannonPhysicsCollider()
{
	PrimaryComponentTick.bCanEverTick = true;
}

float UBannonPhysicsCollider::CalculateImpactForce(FVector AttackingLimbVelocity, float AttackerMass, float DefenderMass, FVector ImpactNormal)
{
	// Basic kinetic energy approximation: E = 0.5 * m * v^2
	// Scaled by the dot product of velocity into the impact normal
	float VelocityAlongNormal = FVector::DotProduct(AttackingLimbVelocity, ImpactNormal);
	if (VelocityAlongNormal < 0.0f) {
		VelocityAlongNormal = -VelocityAlongNormal; // ensure positive magnitude towards target
	}
	
	float KineticEnergy = 0.5f * AttackerMass * (VelocityAlongNormal * VelocityAlongNormal);
	
	// Dampen based on defender mass
	float ImpactForce = KineticEnergy / (DefenderMass > 1.0f ? DefenderMass : 1.0f);
	
	return ImpactForce;
}

bool UBannonPhysicsCollider::IsGlancingBlow(FVector ImpactNormal, FVector DefenderForward, float ThresholdAngle)
{
	float DotP = FVector::DotProduct(ImpactNormal.GetSafeNormal(), DefenderForward.GetSafeNormal());
	float Angle = FMath::Acos(DotP); // In radians
	
	if (FMath::RadiansToDegrees(Angle) > ThresholdAngle) {
		return true; // The blow slid off the side
	}
	return false;
}
