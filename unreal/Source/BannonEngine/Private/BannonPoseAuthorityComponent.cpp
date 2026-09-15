#include "BannonPoseAuthorityComponent.h"

UBannonPoseAuthorityComponent::UBannonPoseAuthorityComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonPoseAuthorityComponent::BeginPoseFrame()
{
    ++PoseFrame;
    ContestedWriteCount = 0;
    TotalWriteCount = 0;
    Claims.Reset();
}

bool UBannonPoseAuthorityComponent::ClaimBone(FName Bone, EBannonPoseOwner Owner)
{
    if (Bone.IsNone() || Owner == EBannonPoseOwner::None)
        return false;

    ++TotalWriteCount;

    if (EBannonPoseOwner* Existing = Claims.Find(Bone))
    {
        if (*Existing != Owner)
        {
            ++ContestedWriteCount;
            UE_LOG(LogTemp, Warning,
                TEXT("[BANNON][POSE CONTENTION] frame=%llu bone=%s owner=%d requested=%d"),
                PoseFrame, *Bone.ToString(), static_cast<int32>(*Existing), static_cast<int32>(Owner));
            return false;
        }
        return true;
    }

    Claims.Add(Bone, Owner);
    return true;
}

void UBannonPoseAuthorityComponent::ReleaseClaims()
{
    Claims.Reset();
}

EBannonPoseOwner UBannonPoseAuthorityComponent::GetBoneOwner(FName Bone) const
{
    if (const EBannonPoseOwner* Owner = Claims.Find(Bone))
        return *Owner;
    return EBannonPoseOwner::None;
}
