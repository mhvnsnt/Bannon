#include "BannonMultiBodyPileUpConstraints.h"
#include "GameFramework/Actor.h"
#include "PhysicsEngine/PhysicsConstraintComponent.h"

UBannonMultiBodyPileUpConstraints::UBannonMultiBodyPileUpConstraints()
{
    PrimaryComponentTick.bCanEverTick = true;
    MaxStackingPenetration = 2.0f;
    ForceDistributionMultiplier = 1.5f;
}

void UBannonMultiBodyPileUpConstraints::BeginPlay()
{
    Super::BeginPlay();
}

void UBannonMultiBodyPileUpConstraints::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
}

void UBannonMultiBodyPileUpConstraints::CalculateMultiBodyStacking(TArray<AActor*> StackedBodies)
{
    if (StackedBodies.Num() < 3) return;
    
    float TotalMass = 0.0f;
    for (int32 i = 0; i < StackedBodies.Num() - 1; ++i)
    {
        AActor* BodyA = StackedBodies[i];
        AActor* BodyB = StackedBodies[i+1];
        
        UPhysicsConstraintComponent* StackConstraint = NewObject<UPhysicsConstraintComponent>(BodyA);
        StackConstraint->RegisterComponent();
        StackConstraint->AttachToComponent(BodyA->GetRootComponent(), FAttachmentTransformRules::KeepWorldTransform);
        StackConstraint->SetConstrainedComponents(
            Cast<UPrimitiveComponent>(BodyA->GetRootComponent()), NAME_None,
            Cast<UPrimitiveComponent>(BodyB->GetRootComponent()), NAME_None
        );
        
        StackConstraint->SetAngularSwing1Limit(ACM_Limited, 15.0f);
        StackConstraint->SetAngularSwing2Limit(ACM_Limited, 15.0f);
        StackConstraint->SetAngularTwistLimit(ACM_Limited, 10.0f);
        
        TotalMass += 100.0f; 
    }
    TotalMass += 100.0f;
    
    UE_LOG(LogTemp, Warning, TEXT("Bannon Physics: Resolving multi-body pile up constraint for %d bodies. Distributed mass: %f. Angular limits enforced."), StackedBodies.Num(), TotalMass);
}
