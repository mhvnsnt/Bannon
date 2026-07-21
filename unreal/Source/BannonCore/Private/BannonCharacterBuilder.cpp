#include "BannonCharacterBuilder.h"
#include "BannonVerletClothComponent.h"
#include "BannonJigglePhysicsComponent.h"
#include "GameFramework/Actor.h"

UBannonCharacterBuilder::UBannonCharacterBuilder() {
    MeshCompositor = CreateDefaultSubobject<UBannonMeshCompositor>(TEXT("MeshCompositor"));
    IKBridge = CreateDefaultSubobject<UBannonGrappleIKBridge>(TEXT("IKBridge"));
    MaxHitPoints = 10000.0f;
    VelocityLimit = 3.8f;
    DamageScale = 8.0f;
}

void UBannonCharacterBuilder::ApplyMorphAndSyncPhysics() {
    if (MeshCompositor && MeshCompositor->PrimaryMesh) {
        for (const auto& Pair : MorphTargets) {
            MeshCompositor->PrimaryMesh->SetMorphTarget(Pair.Key, Pair.Value);
        }

        float CoreWidth = MorphTargets.Contains(TEXT("Core_ScaleX")) ? MorphTargets[TEXT("Core_ScaleX")] : 1.0f;
        float ArmMass = MorphTargets.Contains(TEXT("Arms_ScaleX")) ? MorphTargets[TEXT("Arms_ScaleX")] : 1.0f;
        
        AActor* OwnerActor = MeshCompositor->PrimaryMesh->GetOwner();
        if (OwnerActor) {
            UBannonJigglePhysicsComponent* JiggleComp = OwnerActor->FindComponentByClass<UBannonJigglePhysicsComponent>();
            if (!JiggleComp) {
                JiggleComp = NewObject<UBannonJigglePhysicsComponent>(OwnerActor);
                JiggleComp->RegisterComponent();
                JiggleComp->AutoDetectJiggleBones(MeshCompositor->PrimaryMesh);
            }

            UBannonVerletClothComponent* ClothComp = OwnerActor->FindComponentByClass<UBannonVerletClothComponent>();
            if (!ClothComp) {
                ClothComp = NewObject<UBannonVerletClothComponent>(OwnerActor);
                ClothComp->RegisterComponent();
            }
        }
    }
}
