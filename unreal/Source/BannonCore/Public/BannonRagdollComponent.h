// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonRagdollComponent.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonRagdollComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonRagdollComponent();

	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

	// Blends the skeletal mesh into physical simulation
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ImpactBlend(float BlendWeight);

	// Applies a specific physical force vector to the skeletal mesh
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ApplyReversalImpulse(FVector ImpulseVector);

	// Alters the core balance logic by temporarily offsetting the COM
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ShiftCenterOfMass(FVector Offset);

	// Dynamically stiffens joints to simulate blocking or bracing
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void SetJointStiffness(float StiffnessScale);

protected:
	virtual void BeginPlay() override;

private:
	float CurrentBlend;
	FVector COMOffset;
	float TargetStiffness;
};
