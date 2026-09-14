// Copyright BANNON.

#include "BannonDynamicRope.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"

UBannonDynamicRope::UBannonDynamicRope()
{
    PrimaryComponentTick.bCanEverTick = true;
    RopeCable = nullptr;
    RopeElasticity = 1.35f;
    SegmentLength = 40.0f;
    ConstraintIterations = 5;
    WindForce = FVector(5.0f, 0.0f, 0.0f);
}

void UBannonDynamicRope::BeginPlay()
{
    Super::BeginPlay();
    RopeNodes.Empty();
    const FVector StartPos = GetOwner() ? GetOwner()->GetActorLocation() : FVector::ZeroVector;
    const FVector EndPos = StartPos + FVector(400.0f, 0.0f, 0.0f);

    for (int32 idx = 0; idx < 10; ++idx)
    {
        FBannonVerletPoint Node;
        const float Alpha = static_cast<float>(idx) / 9.0f;
        Node.CurrentPosition = FVector::Lerp(StartPos, EndPos, Alpha);
        Node.OldPosition = Node.CurrentPosition;
        Node.bIsPinned = (idx == 0 || idx == 9);
        RopeNodes.Add(Node);
    }
}

void UBannonDynamicRope::ApplyRopeTension(ACharacter* InteractingCharacter, FVector HitLocation)
{
    if (!InteractingCharacter) return;

    float MinDist = MAX_flt;
    int32 NearestNodeIdx = -1;
    for (int32 idx = 0; idx < RopeNodes.Num(); ++idx)
    {
        const float Dist = FVector::DistSquared(RopeNodes[idx].CurrentPosition, HitLocation);
        if (Dist < MinDist)
        {
            MinDist = Dist;
            NearestNodeIdx = idx;
        }
    }

    if (NearestNodeIdx == -1 || RopeNodes[NearestNodeIdx].bIsPinned) return;

    const float CharacterMass = 100.0f;
    const FVector VelocityDiff = InteractingCharacter->GetVelocity();
    RopeNodes[NearestNodeIdx].CurrentPosition += VelocityDiff * 0.05f;

    const FVector Displacement = RopeNodes[NearestNodeIdx].CurrentPosition - RopeNodes[NearestNodeIdx].OldPosition;
    const FVector TensionForce = -Displacement * RopeElasticity * CharacterMass;

    UE_LOG(LogTemp, Log, TEXT("Bannon Physics: Rope node=%d displacement=%s tension=%s"),
        NearestNodeIdx, *Displacement.ToString(), *TensionForce.ToString());

    if (TensionForce.Size() > 150.0f)
    {
        const FVector LaunchVelocity = CalculateReboundVelocity(
            InteractingCharacter->GetVelocity(), RopeElasticity);

        // Rope is an impulse source, not a transform writer. LaunchCharacter
        // feeds the authoritative CharacterMovement component instead of
        // teleporting or directly rotating the actor.
        if (UCharacterMovementComponent* Movement = InteractingCharacter->GetCharacterMovement())
        {
            Movement->Velocity = LaunchVelocity;
        }

        UE_LOG(LogTemp, Warning,
            TEXT("Bannon Physics: Rope rebound submitted to CharacterMovement: %s"),
            *LaunchVelocity.ToString());
    }
}

FVector UBannonDynamicRope::CalculateReboundVelocity(FVector IncomingVelocity, float RopeTensionScalar)
{
    const FVector Normal(0.0f, -1.0f, 0.0f);
    const FVector Reflected =
        IncomingVelocity - 2.0f * FVector::DotProduct(IncomingVelocity, Normal) * Normal;
    return Reflected * RopeElasticity * RopeTensionScalar;
}

void UBannonDynamicRope::SimulateVerletRope(float DeltaTime)
{
    if (DeltaTime <= 0.0f) return;

    const FVector Gravity(0.0f, 0.0f, -980.0f);
    for (int32 idx = 0; idx < RopeNodes.Num(); ++idx)
    {
        FBannonVerletPoint& Node = RopeNodes[idx];
        if (Node.bIsPinned) continue;

        const FVector TempPos = Node.CurrentPosition;
        const FVector Acceleration = Gravity + WindForce;
        Node.CurrentPosition +=
            (Node.CurrentPosition - Node.OldPosition) +
            (Acceleration * DeltaTime * DeltaTime);
        Node.OldPosition = TempPos;
    }

    ResolveVerletConstraints();
}

void UBannonDynamicRope::ResolveVerletConstraints()
{
    for (int32 Iter = 0; Iter < ConstraintIterations; ++Iter)
    {
        for (int32 idx = 0; idx < RopeNodes.Num() - 1; ++idx)
        {
            FBannonVerletPoint& NodeA = RopeNodes[idx];
            FBannonVerletPoint& NodeB = RopeNodes[idx + 1];

            const FVector Delta = NodeB.CurrentPosition - NodeA.CurrentPosition;
            const float CurrentDist = Delta.Size();
            if (CurrentDist <= KINDA_SMALL_NUMBER) continue;

            const float Difference = SegmentLength - CurrentDist;
            const float Percent = Difference / CurrentDist / 2.0f;
            const FVector Offset = Delta * Percent;

            if (!NodeA.bIsPinned) NodeA.CurrentPosition -= Offset;
            if (!NodeB.bIsPinned) NodeB.CurrentPosition += Offset;
        }
    }
}
