#include "BannonProceduralBalanceRecoveryMatrix.h"

UBannonProceduralBalanceRecoveryMatrix::UBannonProceduralBalanceRecoveryMatrix()
{
    PrimaryComponentTick.bCanEverTick = true;
    RecoveryThreshold = 45.0f;
    FallAngularVelocityLimit = 150.0f;
    bIsRagdolling = false;
}

void UBannonProceduralBalanceRecoveryMatrix::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonProceduralBalanceRecoveryMatrix::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
}

void UBannonProceduralBalanceRecoveryMatrix::CalculateBalanceState(FVector CenterOfMass, FVector BaseOfSupport, float AngularVelocity)
{
    float Deviation = FVector::Dist2D(CenterOfMass, BaseOfSupport);

    if (Deviation < RecoveryThreshold && AngularVelocity < FallAngularVelocityLimit)
    {
        if (bIsRagdolling)
        {
            bIsRagdolling = false;
            UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Balance Recovery Matrix stable. Initiating get-up blend."));
        }
    }
    else
    {
        if (!bIsRagdolling)
        {
            bIsRagdolling = true;
            UE_LOG(LogTemp, Error, TEXT("Bannon Physics: Balance Matrix failure. Center of mass exceeded base of support (Deviation: %f). Triggering active ragdoll collapse."), Deviation);
        }
    }
}
