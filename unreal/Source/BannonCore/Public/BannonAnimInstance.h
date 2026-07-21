#pragma once

#include "CoreMinimal.h"
#include "Animation/AnimInstance.h"
#include "BannonGrappleIKBridge.h"
#include "BannonGGPOBridge.h"
#include "BannonAnimInstance.generated.h"

UCLASS()
class BANNONCORE_API UBannonAnimInstance : public UAnimInstance
{
	GENERATED_BODY()

public:
	UBannonAnimInstance();

	virtual void NativeInitializeAnimation() override;
	virtual void NativeUpdateAnimation(float DeltaSeconds) override;

	UPROPERTY(BlueprintReadOnly, Category = "Bannon|Animation")
	float CurrentPoise;

	UPROPERTY(BlueprintReadOnly, Category = "Bannon|Animation")
	bool bIsCrumpled;

	UPROPERTY(BlueprintReadOnly, Category = "Bannon|Animation")
	int32 GGPOFrame;

	// References to our bridge modules
	UPROPERTY(BlueprintReadWrite, Category = "Bannon|Animation")
	UBannonGrappleIKBridge* GrappleIKBridge;

	UPROPERTY(BlueprintReadWrite, Category = "Bannon|Animation")
	UBannonGGPOBridge* GGPOBridge;
};
