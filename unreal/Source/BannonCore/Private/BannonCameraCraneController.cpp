#include "BannonCameraCraneController.h"
#include "Engine/Engine.h"

ABannonCameraCraneController::ABannonCameraCraneController() {
    PrimaryActorTick.bCanEverTick = true;
    bIsTransitioning = false;
    TransitionProgress = 0.0f;
    TransitionDuration = 1.0f;
}

void ABannonCameraCraneController::BeginPlay() {
    Super::BeginPlay();
}

void ABannonCameraCraneController::Tick(float DeltaTime) {
    Super::Tick(DeltaTime);
    if (bIsTransitioning) {
        TransitionProgress += DeltaTime / TransitionDuration;
        if (TransitionProgress >= 1.0f) {
            TransitionProgress = 1.0f;
            bIsTransitioning = false;
            UE_LOG(LogTemp, Log, TEXT("Camera Crane Transition Complete."));
        }
        
        FVector OutPosition;
        CalculateBezierPath(FVector(0,0,1000), FVector(500,500,500), FVector(1000,0,200), TransitionProgress, OutPosition);
        // Apply position and tilt...
    }
}

void ABannonCameraCraneController::CalculateBezierPath(FVector StartPoint, FVector ControlPoint, FVector EndPoint, float Alpha, FVector& OutPosition) {
    FVector P01 = FMath::Lerp(StartPoint, ControlPoint, Alpha);
    FVector P12 = FMath::Lerp(ControlPoint, EndPoint, Alpha);
    OutPosition = FMath::Lerp(P01, P12, Alpha);
}

void ABannonCameraCraneController::TransitionCameraStageToRing(float Duration) {
    bIsTransitioning = true;
    TransitionProgress = 0.0f;
    TransitionDuration = FMath::Max(0.1f, Duration);
    UE_LOG(LogTemp, Log, TEXT("Initiating smoothed Bezier camera paths from stage to ring."));
}
