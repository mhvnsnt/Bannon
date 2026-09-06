// Copyright BANNON.
// Blueprint-facing surface for the native combat/physics laws. Every function here forwards to the
// tested header-only core in ../../../native — so designers tune the SAME numbers the web build and
// the ctest suite already validate. Immutable constants (MAX_HP 10000 / DMG_SCALE 8 / MAX_BODY_VEL
// 3.8 / MAX_STAMINA 440) are exposed read-only.
#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "BannonLaws.generated.h"

UCLASS()
class BANNONCORE_API UBannonLaws : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()

public:
	// ---- immutable constants (read-only; never rebalance combat by changing these) ----
	UFUNCTION(BlueprintPure, Category="Bannon|Laws") static float MaxHP();
	UFUNCTION(BlueprintPure, Category="Bannon|Laws") static float DmgScale();
	UFUNCTION(BlueprintPure, Category="Bannon|Laws") static float MaxBodyVel();
	UFUNCTION(BlueprintPure, Category="Bannon|Laws") static float MaxStamina();

	// ---- roll-stable bone aim (the spiral-leg fix) — feed to a Control Rig Aim node ----
	// Returns the world-space rotation that points RestFwd at TargetDir with a deterministic roll.
	UFUNCTION(BlueprintPure, Category="Bannon|Anim")
	static FQuat RollStableAim(FVector RestFwd, FVector TargetDir);

	// ---- submission hold step (torque -> local limb HP -> organic tap) ----
	// Advances one hold tick; returns true when the defender taps. Mirrors bannon_referee.h.
	UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
	static bool SubmissionStep(UPARAM(ref) float& JointRotation, float RotationLimit,
	                           UPARAM(ref) float& LimbHP, float AttackerCrank, float DefenderResist,
	                           UPARAM(ref) float& DefenderStamina, float Dt);

	// ---- pin kickout tier (kinetic burst by count time) ----
	UFUNCTION(BlueprintCallable, Category="Bannon|Combat")
	static bool PinKickout(float HpFrac, float StamFrac, float KickTime, float MassDelta,
	                       float& OutBurstVel, float& OutStruggleTime);
};
