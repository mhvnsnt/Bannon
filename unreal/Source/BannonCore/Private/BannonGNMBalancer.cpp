#include "BannonGNMBalancer.h"
#include "Components/SkeletalMeshComponent.h"
#include "BannonMatchStateLogic.h"
#include "Kismet/KismetMathLibrary.h"

UBannonGNMBalancer::UBannonGNMBalancer() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonGNMBalancer::IngestNeuralMorphWeights(const TMap<FName, float>& GNMWeights, USkeletalMeshComponent* TargetMesh) {
    if (!TargetMesh) return;

    // Direct mapping of Google GNM latent arrays to native UE Morph Targets
    // This allows real-time neural face generation to blend smoothly across the topology.
    for (const auto& WeightPair : GNMWeights) {
        TargetMesh->SetMorphTarget(WeightPair.Key, WeightPair.Value);
    }
}

void UBannonGNMBalancer::ApplyExpressionDrivers(UBannonMatchStateLogic* MatchLogic, USkeletalMeshComponent* TargetMesh) {
    if (!MatchLogic || !TargetMesh) return;

    // Dynamically override GNM baseline with combat physics (Poise/Fatigue)
    // Example: High fatigue forces jaw drop / eye squint morphs over the neural base.
    float HeadFatigue = MatchLogic->GetCurrentLimbFatigue(TEXT("bone_Head"));
    float PainMorph = FMath::Clamp(HeadFatigue / 100.0f, 0.0f, 1.0f);
    
    TargetMesh->SetMorphTarget(TEXT("EXPR_Pain"), PainMorph);
}
