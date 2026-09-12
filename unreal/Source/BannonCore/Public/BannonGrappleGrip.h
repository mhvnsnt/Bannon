// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGrappleGrip.generated.h"

class USkeletalMeshComponent;

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonGrappleGrip : public UActorComponent
{
	GENERATED_BODY()

public:
	UBannonGrappleGrip();

	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	bool GripNearest(USkeletalMeshComponent* TargetMesh, FVector HandPos);

	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	void ReleaseGrip();

	UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
	bool IsGripping() const;

protected:
	virtual void BeginPlay() override;

private:
	bool bIsGripping;
	USkeletalMeshComponent* CurrentTarget;
};
