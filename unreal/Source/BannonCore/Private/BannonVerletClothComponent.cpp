#include "BannonVerletClothComponent.h"

UBannonVerletClothComponent::UBannonVerletClothComponent() {
    PrimaryComponentTick.bCanEverTick = true;
}

void UBannonVerletClothComponent::InitializeCloth(const TArray<FVector>& InitialPositions, const TArray<FClothConstraint>& InitialConstraints) {
    Nodes.Empty();
    for (const FVector& Pos : InitialPositions) {
        FClothNode Node;
        Node.Position = Pos; Node.PreviousPosition = Pos; Node.bIsPinned = false;
        Nodes.Add(Node);
    }
    if (Nodes.Num() > 0) Nodes[0].bIsPinned = true;
    if (Nodes.Num() > 1) Nodes[1].bIsPinned = true;
    Constraints = InitialConstraints;
}

void UBannonVerletClothComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    if (Nodes.Num() == 0 || DeltaTime <= 0.0f) return;
    FVector Gravity = FVector(0, 0, -980.0f) * GravityScale;

    for (int32 i = 0; i < Nodes.Num(); ++i) {
        if (Nodes[i].bIsPinned) continue;
        FVector Temp = Nodes[i].Position;
        Nodes[i].Position = Nodes[i].Position + (Nodes[i].Position - Nodes[i].PreviousPosition) * (1.0f - Damping) + Gravity * (DeltaTime * DeltaTime);
        Nodes[i].PreviousPosition = Temp;
    }

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
