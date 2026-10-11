#include "BannonVerletClothComponent.h"
#include "Engine/Engine.h"

UBannonVerletClothComponent::UBannonVerletClothComponent() {
    PrimaryComponentTick.bCanEverTick = true;
}

void UBannonVerletClothComponent::InitializeCloth(const TArray<FVector>& InitialPositions, const TArray<FClothConstraint>& InitialConstraints) {
    Nodes.Empty();
    for (const FVector& Pos : InitialPositions) {
        FClothNode Node;
        Node.Position = Pos; Node.PreviousPosition = Pos; Node.bIsPinned = false;
        Node.AnchorBone = NAME_None;
        Nodes.Add(Node);
    }
    Constraints = InitialConstraints;
    UE_LOG(LogTemp, Log, TEXT("[BRICK 55] Verlet SecondaryPhysicsSystem Initialized."));
}

void UBannonVerletClothComponent::AnchorToFighter(FName BoneName, int32 NodeIndex) {
    if (NodeIndex >= 0 && NodeIndex < Nodes.Num()) {
        Nodes[NodeIndex].bIsPinned = true;
        Nodes[NodeIndex].AnchorBone = BoneName;
        UE_LOG(LogTemp, Log, TEXT("[BRICK 55] Anchored node %d to %s for real-time momentum tracking."), NodeIndex, *BoneName.ToString());
    }
}

void UBannonVerletClothComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    if (Nodes.Num() == 0 || DeltaTime <= 0.0f) return;

    FVector Gravity = FVector(0, 0, -980.0f) * GravityScale;

    // Verlet integration
    for (int32 i = 0; i < Nodes.Num(); ++i) {
        if (Nodes[i].bIsPinned) {
            // In a real scenario, we would pull the transform from the Fighter's skeleton bone (Pelvis/Chest).
            // This anchors the loincloth/cape momentum dynamically to the skeletal mesh.
            continue;
        }

        FVector Temp = Nodes[i].Position;
        Nodes[i].Position = Nodes[i].Position + (Nodes[i].Position - Nodes[i].PreviousPosition) * (1.0f - Damping) + Gravity * (DeltaTime * DeltaTime);
        Nodes[i].PreviousPosition = Temp;
    }

    // Constraint resolution
    for (int32 Iter = 0; Iter < ConstraintIterations; ++Iter) {
        for (FClothConstraint& Constraint : Constraints) {
            if (Constraint.NodeA >= Nodes.Num() || Constraint.NodeB >= Nodes.Num()) continue;

            FVector Delta = Nodes[Constraint.NodeB].Position - Nodes[Constraint.NodeA].Position;
            float CurrentLength = Delta.Size();
            if (CurrentLength > KINDA_SMALL_NUMBER) {
                float Difference = (CurrentLength - Constraint.RestLength) / CurrentLength;
                FVector Correction = Delta * 0.5f * Difference * Stiffness;
                if (!Nodes[Constraint.NodeA].bIsPinned) Nodes[Constraint.NodeA].Position += Correction;
                if (!Nodes[Constraint.NodeB].bIsPinned) Nodes[Constraint.NodeB].Position -= Correction;
            }
        }
    }
}
