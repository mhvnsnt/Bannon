#include "BannonCollisionComponent.h"
#include "Math/UnrealMathUtility.h"

UBannonCollisionComponent::UBannonCollisionComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UBannonCollisionComponent::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonCollisionComponent::ProcessBoneImpact(FName HitBone, FVector ImpactLocation, FVector ImpactVelocity, float KineticMass)
{
    // Absolute Math Enforcement: Route impact force through core constants.
    float VelocityMagnitude = ImpactVelocity.Size();
    
    // Enforce the MAX_BODY_VEL = 3.8 m/s absolute hard cap on physical knockback or impulse generated
    if (VelocityMagnitude > MAX_BODY_VEL)
    {
        VelocityMagnitude = MAX_BODY_VEL;
    }

    // Scale the baseline damage strictly using DMG_SCALE = 8.0
    float BaseForce = VelocityMagnitude * KineticMass;
    float ScaledForce = BaseForce * DMG_SCALE;

    // Poise Degradation Routing: Pipe final kinetic force directly into the target's Poise memory address.
    // Do not subtract from MAX_HP = 10000 to trigger crumple states. HP remains on a 100x scale independent of physical crumple.
    float PoiseDegradationDelta = ScaledForce * 0.5f; 

    // Impact Telemetry: Push exact collision coordinates, calculated force, and resulting Poise degradation delta out through UE_LOG_STREAM
    LogImpactTelemetry(HitBone, ImpactLocation, ScaledForce, PoiseDegradationDelta);
}

void UBannonCollisionComponent::LogImpactTelemetry(FName Bone, FVector Location, float Force, float PoiseDelta)
{
    UE_LOG(LogTemp, Warning, TEXT("[R.A.B.B.I.T.S.F.O.O.T.] KINETIC_IMPACT | Bone: %s | Loc: X=%.2f Y=%.2f Z=%.2f | Force: %.2f | PoiseDelta: %.2f"), 
        *Bone.ToString(), Location.X, Location.Y, Location.Z, Force, PoiseDelta);
}
