#include "BannonNetSyncState.h"

void UBannonNetSyncState::PackRagdollStateForNetwork(const TArray<FVector>& AllBoneTransforms, TArray<FVector>& OutCompressedNetworkBones)
{
    // Replicating 100+ bones during a ragdoll state crashes bandwidth. 
    // This compresses the skeleton to just the major IK drivers (Pelvis, Head, Hands, Feet) for the wire.
    OutCompressedNetworkBones.Empty();
    
    if (AllBoneTransforms.Num() >= 6)
    {
        // Example mapping: 0=Pelvis, 1=Head, 2=L_Hand, 3=R_Hand, 4=L_Foot, 5=R_Foot
        OutCompressedNetworkBones.Add(AllBoneTransforms[0]); 
        OutCompressedNetworkBones.Add(AllBoneTransforms[1]); 
        OutCompressedNetworkBones.Add(AllBoneTransforms[2]); 
        OutCompressedNetworkBones.Add(AllBoneTransforms[3]); 
        OutCompressedNetworkBones.Add(AllBoneTransforms[4]); 
        OutCompressedNetworkBones.Add(AllBoneTransforms[5]); 
    }
}
