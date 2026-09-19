#include "BannonDumpsterObjectContainment.h"
#include "GameFramework/Character.h"
#include "Components/PrimitiveComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Animation/AnimInstance.h"

UBannonDumpsterObjectContainment::UBannonDumpsterObjectContainment()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonDumpsterObjectContainment::CalculateContainmentPhysics(AActor* Dumpster, AActor* ThrownFighter)
{
    if (Dumpster && ThrownFighter)
    {
        UPrimitiveComponent* DumpsterComp = Cast<UPrimitiveComponent>(Dumpster->GetRootComponent());
        ACharacter* FighterChar = Cast<ACharacter>(ThrownFighter);
        
        if (DumpsterComp && FighterChar)
        {
            // Confine fighter to dumpster physics grid space by snapping to socket and enabling ragdoll
            FighterChar->SetActorLocation(DumpsterComp->GetComponentLocation());
            
            USkeletalMeshComponent* Mesh = FighterChar->GetMesh();
            if (Mesh)
            {
                Mesh->SetSimulatePhysics(true);
                Mesh->WakeAllRigidBodies();
                
                // Deep AnimGraph Binding: Set containment state for specialized struggling animations
                UAnimInstance* AnimInst = Mesh->GetAnimInstance();
                if (AnimInst)
                {
                    FBoolProperty* ContainedProp = FindFProperty<FBoolProperty>(AnimInst->GetClass(), FName("bIsInContainment"));
                    if (ContainedProp)
                    {
                        ContainedProp->SetPropertyValue_InContainer(AnimInst, true);
                    }
                }
            }
            UE_LOG(LogTemp, Warning, TEXT("Bannon Sandbox: Confined fighter %s to dumpster physics grid space."), *ThrownFighter->GetName());
        }
    }
}
