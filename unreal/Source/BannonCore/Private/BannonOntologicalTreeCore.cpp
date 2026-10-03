#include "BannonOntologicalTreeCore.h"
#include "Components/PrimitiveComponent.h"

UBannonOntologicalTreeCore::UBannonOntologicalTreeCore()
{
    PrimaryComponentTick.bCanEverTick = false;
    AuraResonance = 1.0f;
    EgoDissolution = 0;
    GreedMultiplier = 1.0f;
}

void UBannonOntologicalTreeCore::MutateAlignment(float DeltaAura, int32 DeltaEgo, float DeltaGreed)
{
    AuraResonance = FMath::Clamp(AuraResonance + DeltaAura, 0.0f, 10.0f);
    EgoDissolution = FMath::Clamp(EgoDissolution + DeltaEgo, 0, 100);
    GreedMultiplier = FMath::Clamp(GreedMultiplier + DeltaGreed, 0.5f, 5.0f);
    
    UE_LOG(LogTemp, Warning, TEXT("Bannon RPG: Ontological Alignment Mutated. Aura: %f, Ego: %d, Greed: %f"), AuraResonance, EgoDissolution, GreedMultiplier);
}

void UBannonOntologicalTreeCore::ApplyOntologicalPoiseModifiers(UPrimitiveComponent* PhysicsComp)
{
    if (PhysicsComp)
    {
        // Adjust physical mass scaling based on Aura Resonance (God-Within)
        float BaseMass = PhysicsComp->GetMass();
        float MutatedMass = BaseMass * (1.0f + (AuraResonance * 0.1f));
        PhysicsComp->SetMassOverrideInKg(NAME_None, MutatedMass, true);
        
        UE_LOG(LogTemp, Warning, TEXT("Bannon RPG: Bound Ontological constraints to Poise engine. Mass mutated to %f"), MutatedMass);
    }
}
