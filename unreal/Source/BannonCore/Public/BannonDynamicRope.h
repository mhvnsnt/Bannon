// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDynamicRope.generated.h"

class UCableComponent;

USTRUCT(BlueprintType)
struct FBannonVerletPoint
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	FVector CurrentPosition = FVector::ZeroVector;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	FVector OldPosition = FVector::ZeroVector;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	bool bIsPinned = false;
};

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDynamicRope : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonDynamicRope();

	// Calculate and apply tension force against a wrestler's body mass
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ApplyRopeTension(class ACharacter* InteractingCharacter, FVector HitLocation);

	// Multiplier for when a wrestler bounces off the ropes
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	FVector CalculateReboundVelocity(FVector IncomingVelocity, float RopeTensionScalar);

	// Simulate Verlet integration for the rope points
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void SimulateVerletRope(float DeltaTime);

	// Solve rope segment constraints to maintain resting distance
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ResolveVerletConstraints();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	TArray<FBannonVerletPoint> RopeNodes;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float RopeElasticity;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float SegmentLength;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	int32 ConstraintIterations;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	FVector WindForce;

protected:
	virtual void BeginPlay() override;

private:
	// Reference to the cable component representing the rope
	UCableComponent* RopeCable;
};
