#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGrappleComponent.generated.h"

class UBannonMatchStateComponent;

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonGrappleComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UBannonGrappleComponent();

protected:
    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

public:
    UFUNCTION(BlueprintCallable, Category = "Bannon|Grapple")
    void InitiateGrapple(AActor* TargetDefender, FVector OffsetDistance);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Grapple")
    void BreakGrapple();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Debug")
    void ToggleStretchDebugMode();

    UFUNCTION(BlueprintCallable, Category = "Bannon|MatchState")
    void InitiatePinfall();

    UFUNCTION(BlueprintCallable, Category = "Bannon|MatchState")
    void ProcessSubmissionDPS(float DeltaTime);

    UFUNCTION(BlueprintCallable, Category = "Bannon|MatchState")
    bool CalculateKickOutProbability(float DefenderMaxHP, float DefenderStamina);

private:
    UPROPERTY()
    AActor* ActiveDefender;

    bool bIsGrappling;
    bool bIsPinfallState;
    bool bIsSubmissionState;
    bool bDebugStretchMode;
    FVector TargetOffset;
    
    const float MAX_TENSION_THRESHOLD = 50000.0f;
    const float DMG_SCALE = 8.0f;

    UBannonMatchStateComponent* MatchStateRef;

    void MonitorGrappleTension();
    void ApplyRootMotionLock(float DeltaTime);
    void DebugJointStretch();
};
