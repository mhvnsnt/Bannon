#include "BannonJigglePhysicsComponent.h"

UBannonJigglePhysicsComponent::UBannonJigglePhysicsComponent() {
    PrimaryComponentTick.bCanEverTick = true;
}

void UBannonJigglePhysicsComponent::AutoDetectJiggleBones(USkeletalMeshComponent* InTargetMesh) {
    TargetMesh = InTargetMesh;
    JiggleBones.Empty();
    if (!TargetMesh) return;

    TArray<FName> AllBones;
    TargetMesh->GetBoneNames(AllBones);
    for (const FName& Bone : AllBones) {
        FString BoneStr = Bone.ToString().ToLower();
        if (BoneStr.Contains(TEXT("breast")) || BoneStr.Contains(TEXT("glute")) || 
            BoneStr.Contains(TEXT("belly")) || BoneStr.Contains(TEXT("fat")) || 
            BoneStr.Contains(TEXT("muscle"))) {
            FJiggleBone JBone;
            JBone.BoneName = Bone;
            JBone.CurrentPos = TargetMesh->GetSocketLocation(Bone);
            JBone.Velocity = FVector::ZeroVector;
            JiggleBones.Add(JBone);
        }
    }
}

void UBannonJigglePhysicsComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) {
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
    if (!TargetMesh || DeltaTime <= 0.0f) return;

    FTransform ComponentTransform = TargetMesh->GetComponentTransform();
    for (FJiggleBone& JBone : JiggleBones) {
        FVector TargetPos = TargetMesh->GetSocketLocation(JBone.BoneName);
        FVector Force = (TargetPos - JBone.CurrentPos) * Stiffness;
        JBone.Velocity = (JBone.Velocity + Force * DeltaTime) * (1.0f - Damping);
        JBone.CurrentPos += JBone.Velocity * DeltaTime;
        
        FVector LocalOffset = ComponentTransform.InverseTransformPosition(JBone.CurrentPos) - ComponentTransform.InverseTransformPosition(TargetPos);
        if (LocalOffset.Size() > MaxDeformation) {
            LocalOffset = LocalOffset.GetSafeNormal() * MaxDeformation;
            JBone.CurrentPos = TargetPos + ComponentTransform.TransformVector(LocalOffset);
        }
    }
}
