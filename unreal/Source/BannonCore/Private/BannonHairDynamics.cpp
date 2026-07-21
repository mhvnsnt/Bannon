#include "BannonHairDynamics.h"
#include "GameFramework/Actor.h"

UBannonHairDynamics::UBannonHairDynamics() {
    PrimaryComponentTick.bCanEverTick = true;
    StrandStiffness = 0.8f;
    StrandDamping = 0.3f;
}

void UBannonHairDynamics::RegisterHairStrands(USkeletalMeshComponent* HairMesh) {
    // 1. Identify root hair bones connected to the head socket.
    // 2. Initialize localized collision spheres to prevent head mesh clipping.
}

void UBannonHairDynamics::EvaluateStrandPhysics(float DeltaTime) {
    AActor* Owner = GetOwner();
    if (!Owner) return;

    FVector RootVelocity = Owner->GetVelocity();
    FVector GravityVector(0.0f, 0.0f, -980.0f);

    // 1. Evaluate pendulum/spring math across the MAX_BODY_VEL delta.
    // 2. Apply GravityVector and StrandStiffness parameters to the bone chains.
    // 3. Prevent clipping by enforcing spatial constraints against the head bone proxy.
}

void UBannonHairDynamics::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    EvaluateStrandPhysics(DeltaTime);
}
