#include "BannonTorqueBasedJointLocks.h"

UBannonTorqueBasedJointLocks::UBannonTorqueBasedJointLocks()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonTorqueBasedJointLocks::BeginPlay()
{
    Super::BeginPlay();
}
