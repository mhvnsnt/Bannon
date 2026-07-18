#include "BannonDumpsterObjectContainment.h"

UBannonDumpsterObjectContainment::UBannonDumpsterObjectContainment()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonDumpsterObjectContainment::CalculateContainmentPhysics(AActor* Dumpster, AActor* ThrownFighter)
{
    UE_LOG(LogTemp, Warning, TEXT("Bannon Sandbox: Confining fighter to dumpster physics grid space."));
}
