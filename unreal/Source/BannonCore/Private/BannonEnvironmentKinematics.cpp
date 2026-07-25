#include "BannonEnvironmentKinematics.h"
#include "GameFramework/Actor.h"
#include "Math/UnrealMathUtility.h"

UBannonEnvironmentKinematics::UBannonEnvironmentKinematics()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonEnvironmentKinematics::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonEnvironmentKinematics::ProcessRopeCollision(AActor* TargetActor, FVector IncomingVelocity, float KineticMass)
{
    if (!TargetActor) return;

    // Calculate incoming kinetic force
    float IncomingSpeed = IncomingVelocity.Size();
    float IncomingForce = IncomingSpeed * KineticMass;

    // Apply elastic tension curve and reverse vector
    FVector RecoilDirection = -IncomingVelocity.GetSafeNormal();
    float RecoilSpeed = IncomingSpeed * ELASTICITY_COEFFICIENT;

    // Absolute Velocity Capping
    float ExcessForce = 0.0f;
    if (RecoilSpeed > MAX_BODY_VEL)
    {
        float ExcessSpeed = RecoilSpeed - MAX_BODY_VEL;
        ExcessForce = ExcessSpeed * KineticMass;
        RecoilSpeed = MAX_BODY_VEL;
    }

    FVector FinalRecoilVector = RecoilDirection * RecoilSpeed;

    if (ExcessForce > 0.0f)
    {
        TriggerRopeShakeAnimation(ExcessForce);
    }

    // Tension Telemetry
    float RopeTension = IncomingForce * 1.5f; // Abstract tension calculation
    LogTensionTelemetry(RopeTension, FinalRecoilVector);
}

void UBannonEnvironmentKinematics::ProcessTurnbuckleImpact(AActor* TargetActor, FVector IncomingVelocity, float KineticMass)
{
    if (!TargetActor) return;

    float ImpactSpeed = IncomingVelocity.Size();
    
    if (ImpactSpeed > MAX_BODY_VEL)
    {
        ImpactSpeed = MAX_BODY_VEL;
    }

    float BaseForce = ImpactSpeed * KineticMass;
    float ScaledForce = BaseForce * DMG_SCALE;

    float PoiseDegradation = ScaledForce * 0.5f;

    UE_LOG(LogTemp, Warning, TEXT("[R.A.B.B.I.T.S.F.O.O.T.] TURNBUCKLE_IMPACT | Target: %s | Force: %.2f | PoiseDegradation: %.2f"), 
        *TargetActor->GetName(), ScaledForce, PoiseDegradation);
}

void UBannonEnvironmentKinematics::TriggerRopeShakeAnimation(float ExcessForce)
{
    UE_LOG(LogTemp, Log, TEXT("[BannonEnvironmentKinematics] Velocity capped. Bleeding excess force (%.2f) into rope-shake animation."), ExcessForce);
}

void UBannonEnvironmentKinematics::LogTensionTelemetry(float Tension, FVector RecoilVector)
{
    UE_LOG(LogTemp, Warning, TEXT("[R.A.B.B.I.T.S.F.O.O.T.] ROPE_TENSION | Tension: %.2f | RecoilVector: X=%.2f Y=%.2f Z=%.2f"), 
        Tension, RecoilVector.X, RecoilVector.Y, RecoilVector.Z);
}
