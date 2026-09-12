#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMovePhysicsIntegration.generated.h"

UCLASS()
class BANNONCORE_API UBannonMovePhysicsIntegration : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void ApplyMovePhysics(const FString& MoveID, float AttackerMass, float DefenderMass, UPARAM(ref) FVector& OutPhysicsImpulse, UPARAM(ref) float& OutImpactDamage);
};
