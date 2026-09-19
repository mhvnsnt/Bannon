#include "BannonGodWithinGAS.h"

UBannonGodWithinGAS::UBannonGodWithinGAS()
{
    PrimaryComponentTick.bCanEverTick = true;
    CosmicAlignment = 50.0f;
    MentalAlignment = 50.0f;
    bIsGASInitialized = false;
}

void UBannonGodWithinGAS::BeginPlay()
{
    Super::BeginPlay();
    InitializeAbilitySystem();
}

void UBannonGodWithinGAS::InitializeAbilitySystem()
{
    if (!bIsGASInitialized)
    {
        // Setup GAS specifically for God Within Mode
        // NOTE: We do not use GAS for core brawling/wrestling mechanics
        UE_LOG(LogTemp, Log, TEXT("Bannon GAS: Initializing Gameplay Ability System for God Within progression..."));
        bIsGASInitialized = true;
    }
}

void UBannonGodWithinGAS::GrantOntologicalBuff(FName BuffName)
{
    if (bIsGASInitialized)
    {
        // Apply discrete buffs based on the Ontological Tree of Life
        UE_LOG(LogTemp, Log, TEXT("Bannon GAS: Granting Ontological Buff [%s] based on Tree of Life alignment"), *BuffName.ToString());
    }
}

void UBannonGodWithinGAS::EvaluateTreeOfLifeProgression(float MatchPerformanceScore, float CosmicShift)
{
    CosmicAlignment = FMath::Clamp(CosmicAlignment + CosmicShift, 0.0f, 100.0f);
    MentalAlignment = FMath::Clamp(MentalAlignment + (MatchPerformanceScore * 0.1f), 0.0f, 100.0f);
    
    UE_LOG(LogTemp, Log, TEXT("Bannon Ontology: Tree of Life evaluated. Cosmic: %f, Mental: %f"), CosmicAlignment, MentalAlignment);
}
