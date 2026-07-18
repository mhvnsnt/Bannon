#include "BannonGGPORollback.h"

void UBannonGGPORollback::SaveStateFrame(int32 FrameNumber, const FVector& Position, const FVector& Velocity, TMap<int32, FVector>& OutPositionBuffer, TMap<int32, FVector>& OutVelocityBuffer)
{
    // Caches the deterministic state of the physics engine for GGPO rollback netcode
    OutPositionBuffer.Add(FrameNumber, Position);
    OutVelocityBuffer.Add(FrameNumber, Velocity);
}

void UBannonGGPORollback::LoadStateFrame(int32 FrameNumber, const TMap<int32, FVector>& PositionBuffer, const TMap<int32, FVector>& VelocityBuffer, FVector& OutRestoredPosition, FVector& OutRestoredVelocity)
{
    // Restores a previous deterministic frame when a desync is detected via peer-to-peer divergence
    if (PositionBuffer.Contains(FrameNumber) && VelocityBuffer.Contains(FrameNumber))
    {
        OutRestoredPosition = PositionBuffer[FrameNumber];
        OutRestoredVelocity = VelocityBuffer[FrameNumber];
    }
}
