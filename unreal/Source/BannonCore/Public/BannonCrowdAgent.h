// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "BannonCrowdAgent.generated.h"

UCLASS(ClassGroup=(Bannon))
class BANNONCORE_API ABannonCrowdAgent : public ACharacter
{
	GENERATED_BODY()

public:
	ABannonCrowdAgent();

	virtual void Tick(float DeltaTime) override;

	// Calculate trajectory of a falling wrestler to trigger a fleeing state
	UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
	void EvaluateIncomingThreat(FVector WrestlerVelocity, FVector WrestlerLocation);

	// Contextual logic where stable proximity allows weapon hand-offs
	UFUNCTION(BlueprintCallable, Category="Bannon|Crowd")
	bool TryWeaponHandoff(class ACharacter* Wrestler);

protected:
	virtual void BeginPlay() override;

private:
	bool bIsFleeing;
};
