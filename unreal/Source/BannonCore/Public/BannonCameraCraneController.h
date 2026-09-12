#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BannonCameraCraneController.generated.h"

UCLASS()
class BANNONCORE_API ABannonCameraCraneController : public AActor {
    GENERATED_BODY()
public:
    ABannonCameraCraneController();

    virtual void Tick(float DeltaTime) override;

    UFUNCTION(BlueprintCallable, Category = "Camera")
    void CalculateBezierPath(FVector StartPoint, FVector ControlPoint, FVector EndPoint, float Alpha, FVector& OutPosition);

    UFUNCTION(BlueprintCallable, Category = "Camera")
    void TransitionCameraStageToRing(float Duration);

protected:
    virtual void BeginPlay() override;

private:
    bool bIsTransitioning;
    float TransitionProgress;
    float TransitionDuration;
};
