#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "GameFramework/Actor.h"
#include "Components/BoxComponent.h"
#include "BannonPostMatchSystem.generated.h"

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonExtendedHoldController : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonExtendedHoldController();

    // Triggered when player holds grapple/submission after the bell
    UFUNCTION(BlueprintCallable, Category = "Post Match")
    void InterceptReleaseState(class USkeletalMeshComponent* AttackerMesh, class USkeletalMeshComponent* VictimMesh);

    // Triggers a 5-count from the ref, bypassing causes rivalry spike
    UFUNCTION(BlueprintCallable, Category = "Post Match")
    void TriggerRefereePanicCount();
};

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonBreakoutController : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonBreakoutController();

    // Listens for R3 / Right Stick press during VICTORY_SEQUENCE
    UFUNCTION(BlueprintCallable, Category = "Post Match")
    void TriggerBreakout();
};

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonProceduralInterventionEngine : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonProceduralInterventionEngine();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Intervention")
    float InterventionCheckInterval = 15.0f;

    // Rolls RNG to determine if help arrives during a beatdown
    UFUNCTION(BlueprintCallable, Category = "Post Match")
    void RollForIntervention(const FString& VictimId, const FString& AttackerId, bool bHighRivalry);

private:
    FTimerHandle InterventionTimerHandle;
    void ExecuteInterventionRoll(const FString& VictimId, const FString& AttackerId, bool bHighRivalry);
};

UCLASS()
class BANNONCORE_API ABannonExitTriggerZone : public AActor {
    GENERATED_BODY()
public:
    ABannonExitTriggerZone();

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Trigger")
    UBoxComponent* ExitVolume;

    UFUNCTION()
    void OnOverlapBegin(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult);

    UFUNCTION(BlueprintCallable, Category = "Exit")
    void TriggerArenaExit();
};
