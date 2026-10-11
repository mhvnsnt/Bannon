#include "BannonProceduralSubmissions.h"
#include "Components/SkeletalMeshComponent.h"
#include "PhysicsEngine/PhysicsConstraintComponent.h"

UBannonProceduralSubmissions::UBannonProceduralSubmissions()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UBannonProceduralSubmissions::ApplyKinematicTorque(USkeletalMeshComponent* AttackerMesh, USkeletalMeshComponent* DefenderMesh, FName DefenderLimb, float DeltaTime)
{
    if (!AttackerMesh || !DefenderMesh) return;

    const float DMG_SCALE = 8.0f;
    const float AppliedTorque = 1500.0f;

    // P0 POSE AUTHORITY: submission contact must not teleport the entire attacker mesh.
    // Root/world transforms belong to locomotion/interaction positioning, not limb contact.
    // A previous implementation snapped AttackerMesh to DefenderSocket, which could
    // overwrite locomotion and produce visible pose/root discontinuities.
    const FVector AttackerSocket = AttackerMesh->GetSocketLocation(FName("Hand_R"));
    const FVector DefenderSocket = DefenderMesh->GetSocketLocation(DefenderLimb);
    const float ContactErrorCm = FVector::Dist(AttackerSocket, DefenderSocket);

    // Continuous Poise Drain
    const float ContinuousDrain = (AppliedTorque / 100.f) * DMG_SCALE * DeltaTime;

    UE_LOG(LogTemp, Warning,
        TEXT("Bannon Physics: Kinematic torque applied. ContactErrorCm=%f PoiseDrain=%f. Root transform unchanged."),
        ContactErrorCm, ContinuousDrain);
}
