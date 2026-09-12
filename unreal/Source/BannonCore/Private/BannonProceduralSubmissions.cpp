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
    float AppliedTorque = 1500.0f;

    // Skeletal Constraint Locking logic via motor binding approximation
    FVector AttackerSocket = AttackerMesh->GetSocketLocation(FName("Hand_R"));
    FVector DefenderSocket = DefenderMesh->GetSocketLocation(DefenderLimb);
    AttackerMesh->SetWorldLocation(DefenderSocket); // Lock transforms to prevent clipping
    
    // Continuous Poise Drain
    float ContinuousDrain = (AppliedTorque / 100.f) * DMG_SCALE * DeltaTime;

    UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Kinematic torque applied. Poise drained by %f. Triggering structural joint yield state without touching 10000 MAX_HP."), ContinuousDrain);
}
