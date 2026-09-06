// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "PhysicsEngine/PhysicalAnimationComponent.h"
#include "BannonPhysicalAnimation.generated.h"

USTRUCT(BlueprintType)
struct FBannonPhysicsProfile
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float LinearStrength = 500.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float AngularStrength = 1500.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float LinearDamping = 10.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float AngularDamping = 25.0f;
};

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonPhysicalAnimation : public UPhysicalAnimationComponent
{
	GENERATED_BODY()

public:
	UBannonPhysicalAnimation();

	// PAC setup for Bannon skeleton
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ApplyHitReaction(FName BoneName, FVector StrikeVelocity, float MassRatio);

	// Configures joint profiles for active physical animation (dynamic stiffness vs loose joints)
	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ConfigureBannonPhysicsAsset(const FName& BoneName, const FBannonPhysicsProfile& Profile);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	FBannonPhysicsProfile DefaultProfile;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	float ReactionMultiplier;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Physics")
	bool bUseControlRigIKMapping;
};
