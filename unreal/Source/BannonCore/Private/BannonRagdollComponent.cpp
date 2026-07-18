// Copyright BANNON.

#include "BannonRagdollComponent.h"
#include "GameFramework/Character.h"
#include "Components/SkeletalMeshComponent.h"

UBannonRagdollComponent::UBannonRagdollComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
	CurrentBlend = 0.0f;
	COMOffset = FVector::ZeroVector;
	TargetStiffness = 1.0f;
}

void UBannonRagdollComponent::BeginPlay()
{
	Super::BeginPlay();
}

void UBannonRagdollComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

	// Decay the ragdoll blend back to zero over time (recovering from impact)
	if (CurrentBlend > 0.0f) {
		CurrentBlend = FMath::Max(0.0f, CurrentBlend - (DeltaTime * 2.0f));
	}
}

void UBannonRagdollComponent::ImpactBlend(float BlendWeight)
{
	CurrentBlend = FMath::Clamp(BlendWeight, 0.0f, 1.0f);
	
	ACharacter* Owner = Cast<ACharacter>(GetOwner());
	if (Owner && Owner->GetMesh()) {
		// Native UE5 Physical Animation / Ragdoll blend trigger
		Owner->GetMesh()->SetAllBodiesBelowPhysicsBlendWeight(FName("pelvis"), CurrentBlend);
	}
}

void UBannonRagdollComponent::ApplyReversalImpulse(FVector ImpulseVector)
{
	ACharacter* Owner = Cast<ACharacter>(GetOwner());
	if (Owner && Owner->GetMesh()) {
		// Apply physical impulse to the core body during a reversal
		Owner->GetMesh()->AddImpulseToAllBodiesBelow(ImpulseVector, FName("pelvis"));
	}
}

void UBannonRagdollComponent::ShiftCenterOfMass(FVector Offset)
{
	COMOffset = Offset;
	
	ACharacter* Owner = Cast<ACharacter>(GetOwner());
	if (Owner && Owner->GetMesh()) {
		Owner->GetMesh()->SetCenterOfMass(COMOffset, FName("pelvis"));
	}
}

void UBannonRagdollComponent::SetJointStiffness(float StiffnessScale)
{
	TargetStiffness = FMath::Clamp(StiffnessScale, 0.0f, 10.0f);
	// In a full implementation, this would iterate through PhysicsAsset constraints
	// and multiply their angular/linear drive spring values by TargetStiffness.
}
