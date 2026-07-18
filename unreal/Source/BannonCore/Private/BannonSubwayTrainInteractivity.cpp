#include "BannonSubwayTrainInteractivity.h"
#include "GameFramework/Actor.h"

UBannonSubwayTrainInteractivity::UBannonSubwayTrainInteractivity()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonSubwayTrainInteractivity::ApplyInertialPhysicsToFighters(TArray<AActor*> Occupants, FVector TrainVelocity)
{
    for (AActor* Fighter : Occupants)
    {
        UE_LOG(LogTemp, Warning, TEXT("Bannon Sandbox: Applying subway inertial physics vector %s to fighter."), *TrainVelocity.ToString());
    }
}
