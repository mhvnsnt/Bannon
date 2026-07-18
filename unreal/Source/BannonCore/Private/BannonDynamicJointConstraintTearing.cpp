#include "BannonDynamicJointConstraintTearing.h"

UBannonDynamicJointConstraintTearing::UBannonDynamicJointConstraintTearing()
{
    PrimaryComponentTick.bCanEverTick = false;
    TearThreshold = 5000.0f;
}

void UBannonDynamicJointConstraintTearing::SimulateHyperExtension(FName JointName, float AppliedTorque)
{
    if (AppliedTorque >= TearThreshold)
    {
        UE_LOG(LogTemp, Error, TEXT("Bannon Physics: Constraint Tearing triggered on joint %s (Torque: %f). Permanent injury applied."), *JointName.ToString(), AppliedTorque);
    }
}
