#include "BannonJointDislocationEvents.h"

UBannonJointDislocationEvents::UBannonJointDislocationEvents()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonJointDislocationEvents::BeginPlay()
{
    Super::BeginPlay();
}
