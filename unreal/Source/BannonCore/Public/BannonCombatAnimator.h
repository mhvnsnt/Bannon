// AI ORIENTATION BLOCK v114
// godmode prefix. Autonomous. Constants immutable. No WebGL/Three legacy.

#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonPhysicsLaws.h"
#include "BannonCombatAnimator.generated.h"

class USkeletalMeshComponent;

UCLASS(ClassGroup=(BannonCombat), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonCombatAnimator : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonCombatAnimator();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Combat")
    void InitializeAnimator(USkeletalMeshComponent* InMesh);

    // Binds root motion curve extraction directly to the physics proxy for foot planting stability
    UFUNCTION(BlueprintCallable, Category = "Bannon|Combat")
    void ExtractAndApplyRootMotion(float DeltaTime);

    // Time dilation manipulation for 3-5 frame heavy impact weights
    UFUNCTION(BlueprintCallable, Category = "Bannon|Combat")
    void TriggerHitStop(float DurationFrames);

    // GGPO-friendly Active Ragdoll blend on a per-limb basis via Jolt/Chaos constraints
    UFUNCTION(BlueprintCallable, Category = "Bannon|Combat")
    void BlendActiveRagdollLimb(FName BoneName, float BlendWeight);

    // Applies realistic angular swing/twist limits to physical constraints dynamically
    UFUNCTION(BlueprintCallable, Category = "Bannon|Combat|Physics")
    void ApplyRealisticJointLimits(FName JointName, float Swing1Limit, float Swing2Limit, float TwistLimit);

    // Tyneshia / Karma God Within Mode In-Game Mechanic
    UFUNCTION(BlueprintCallable, Category = "Bannon|Combat|Moves")
    void ExecuteRealityCheck(class ABannonCharacter* Target);

private:
    UPROPERTY()
    USkeletalMeshComponent* OwnerMesh;

    float CurrentHitStopTimer;
    bool bIsHitStopActive;
};
