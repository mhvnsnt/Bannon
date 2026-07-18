#include "BannonMassDrivenCollisionHulls.h"

UBannonMassDrivenCollisionHulls::UBannonMassDrivenCollisionHulls()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonMassDrivenCollisionHulls::BeginPlay()
{
    Super::BeginPlay();
}
