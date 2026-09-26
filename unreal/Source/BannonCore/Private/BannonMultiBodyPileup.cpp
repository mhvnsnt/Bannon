#include "BannonMultiBodyPileup.h"
#include "GameFramework/Actor.h"

UBannonMultiBodyPileup::UBannonMultiBodyPileup()
{
    PrimaryComponentTick.bCanEverTick = true;
    CumulativeMass = 0.0f;
}

void UBannonMultiBodyPileup::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonMultiBodyPileup::CalculateStackedMass(TArray<AActor*> StackedBodies)
{
    CumulativeMass = 0.0f;
    for (AActor* Body : StackedBodies)
    {
        if (Body)
        {
            // Fetch mass from skeletal mesh component
            // For now, we simulate adding arbitrary mass
            CumulativeMass += 110.0f; // Approx 110kg per body
        }
    }
    
    UE_LOG(LogTemp, Log, TEXT("Bannon Physics: Multi-body pile-up detected. Cumulative mass: %f kg"), CumulativeMass);
    // Apply stress to the bottom-most body based on CumulativeMass
}

void UBannonMultiBodyPileup::ResolveClippingConstraints(AActor* PrimaryBody, AActor* SecondaryBody)
{
    // Apply repulsive spring forces if intersection depth exceeds threshold
    UE_LOG(LogTemp, Log, TEXT("Bannon Physics: Resolving clipping constraints for pile-up."));
}
