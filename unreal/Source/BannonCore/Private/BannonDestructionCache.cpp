#include "BannonDestructionCache.h"

void UBannonDestructionCache::CacheFracturedMesh(const FString& PropID, const TArray<FTransform>& ShardTransforms, TMap<FString, TArray<FTransform>>& LevelDestructionCache)
{
    // MDickie sandbox style persistence: If you break a table in the locker room, 
    // go to the ring, and walk back, the table should still be in splinters on the floor.
    // This caches Chaos physics shard transforms to the persistent GameInstance.
    LevelDestructionCache.Add(PropID, ShardTransforms);
}
