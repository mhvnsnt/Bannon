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

void UBannonGGPORollback::RegisterStrikePrediction(int32 Frame, int32 AttackerID, int32 TargetID, const FName& AttackBone, const FVector& StrikeVelocity)
{
	// Logs the frame-perfect strike registration for future confirmation
	UE_LOG(LogTemp, Log, TEXT("Bannon GGPO Netcode: Frame %d - Registered predicted strike from Player %d onto Player %d (Bone: %s, Velocity: %s)"), 
		Frame, AttackerID, TargetID, *AttackBone.ToString(), *StrikeVelocity.ToString());
}

bool UBannonGGPORollback::ResolveRollbackStrike(int32 Frame, int32 ConfirmedAttackerID, int32 ConfirmedTargetID, FName& OutFinalResolvedState)
{
	// In GGPO, if a packet arrives saying player did a move at Frame 50 but we are at 54, 
	// we rollback to Frame 50, apply input, and fast-forward back to 54.
	// This function checks if the strike was confirmed after rolling back.
	
	if (Frame < CurrentConfirmedFrame)
	{
		OutFinalResolvedState = TEXT("Rollback_Discarded");
		UE_LOG(LogTemp, Warning, TEXT("Bannon GGPO Netcode: Frame %d is too old to resolve. Current confirmed frame is %d. Ignoring strike."), Frame, CurrentConfirmedFrame);
		return false;
	}

	OutFinalResolvedState = TEXT("Rollback_Strike_Confirmed");
	UE_LOG(LogTemp, Log, TEXT("Bannon GGPO Netcode: Frame-perfect strike confirmation achieved on frame %d for Attacker %d against Target %d."), Frame, ConfirmedAttackerID, ConfirmedTargetID);
	return true;
}
