#include "BannonMovePhysicsIntegration.h"

void UBannonMovePhysicsIntegration::ApplyMovePhysics(const FString& MoveID, float AttackerMass, float DefenderMass, FVector& OutPhysicsImpulse, float& OutImpactDamage)
{
    // Folds MDickie/WWE 2K moves in with our universal game physics.
    // Calculates the physics force and damage modifier based on the masses involved in the move.
    
    // Base damage and impulse mapped by move type
    float BaseDamage = 10.0f;
    FVector BaseImpulse(0.0f, 0.0f, 0.0f);

    if (MoveID.Contains(TEXT("Powerbomb")))
    {
        BaseDamage = 35.0f;
        BaseImpulse = FVector(0.0f, 0.0f, -800.0f); // Slamming straight down
    }
    else if (MoveID.Contains(TEXT("Lariat")))
    {
        BaseDamage = 20.0f;
        BaseImpulse = FVector(500.0f, 0.0f, 100.0f); // High forward momentum
    }

    // Heavier attackers deal more damage and force, heavier defenders resist force
    float MassRatio = AttackerMass / FMath::Max(DefenderMass, 50.0f);
    
    OutImpactDamage = BaseDamage * MassRatio;
    OutPhysicsImpulse = BaseImpulse * MassRatio;
}
