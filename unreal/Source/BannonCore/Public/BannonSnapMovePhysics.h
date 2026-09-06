#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonSnapMovePhysics.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonSnapMovePhysics : public UActorComponent
{
    GENERATED_BODY()

public:    
    UBannonSnapMovePhysics();

    // Executes a grapple move, bypassing the carry/hold phase if HoldFrames is 0
    UFUNCTION(BlueprintCallable, Category = "Physics|Moves")
    void ExecuteSnapMove(AActor* Attacker, AActor* Defender, FName MoveType, int32 HoldFrames = 0);

    // Forces immediate IK snapping (e.g. snapping hand to defender's neck for a Stunner)
    UFUNCTION(BlueprintCallable, Category = "Physics|Moves")
    void TriggerInstantConstraint(AActor* Attacker, AActor* Defender, FName TargetBone);

protected:
    virtual void BeginPlay() override;

private:
    void ApplyDownwardImpulse(AActor* Defender, float ForceMultiplier);
};
