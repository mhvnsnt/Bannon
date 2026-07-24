#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonGrappleComponent.generated.h"

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

private:
    UPROPERTY()
    AActor* ActiveDefender;

    bool bIsGrappling;
    bool bDebugStretchMode;
    FVector TargetOffset;
    
    const float MAX_TENSION_THRESHOLD = 50000.0f;

    void MonitorGrappleTension();
    void ApplyRootMotionLock(float DeltaTime);
    void DebugJointStretch();
};
