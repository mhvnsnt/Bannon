#include "BannonClothTearing.h"

UBannonClothTearing::UBannonClothTearing()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UBannonClothTearing::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonClothTearing::EvaluateClothStress(FName ClothSection, float CurrentTension, float TearThreshold)
{
    if (CurrentTension > TearThreshold && !TornSections.Contains(ClothSection))
    {
        TornSections.Add(ClothSection);
        UE_LOG(LogTemp, Warning, TEXT("Bannon Rendering: CLOTH TEAR! %s tension (%f) exceeded threshold. Swapping material masks."), *ClothSection.ToString(), CurrentTension);
        
        // Trigger material mask update to reveal torn edges / skin underneath
    }
}
