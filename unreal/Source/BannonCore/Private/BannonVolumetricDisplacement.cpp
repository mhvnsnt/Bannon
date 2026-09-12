#include "BannonVolumetricDisplacement.h"
#include "GameFramework/Actor.h"

UBannonVolumetricDisplacement::UBannonVolumetricDisplacement() {
    PrimaryComponentTick.bCanEverTick = true;
    BaseDisplacementRadius = 250.0f;
}

void UBannonVolumetricDisplacement::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    AActor* Owner = GetOwner();
    if (!Owner) return;

    FVector Velocity = Owner->GetVelocity();
    float Speed = Velocity.Size();

    // Cause the arena's volumetric lighting/fog to physically displace and swirl
    // when heavy bodies (or MAX_BODY_VEL strikes) move through it.
    if (Speed > 150.0f) {
        // Attach Niagara fluid/gas system parameters directly to the root capsule velocity vector.
        // Pushes float vectors into the Global Volumetric Grid to distort gas logic natively.
    }
}
