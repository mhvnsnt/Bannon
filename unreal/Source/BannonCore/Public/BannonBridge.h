// Copyright BANNON.
// The seam between Unreal and the engine-agnostic native core. UE speaks FVector/FQuat; the laws in
// ../../../native speak bannon::Vec3/Quat. These inline adapters convert both ways so every UE class
// calls the SAME tested physics/combat math the web build runs — no re-implementation, no drift.
#pragma once

#include "CoreMinimal.h"

// The native core is header-only C++. Bring in the pieces the runtime needs. (Include path is added
// by BannonCore.Build.cs -> ../../../native/include.)
THIRD_PARTY_INCLUDES_START
#include "bannon_math.h"
#include "bannon_core.h"
#include "bannon_anim_bridge.h"
THIRD_PARTY_INCLUDES_END

namespace BannonBridge
{
	// UE is cm + Z-up + left-handed; the native laws are m + Y-up. Convert on the seam so the laws
	// stay in their own clean space. (UE_M = 100 cm.)
	static constexpr float UE_M = 100.0f;

	FORCEINLINE bannon::Vec3 ToNative(const FVector& V)
	{
		// UE (X fwd, Y right, Z up, cm) -> native (X, Y up, Z, m): map Z->Y, Y->Z.
		return bannon::Vec3(V.X / UE_M, V.Z / UE_M, V.Y / UE_M);
	}
	FORCEINLINE FVector ToUE(const bannon::Vec3& V)
	{
		return FVector(V.x * UE_M, V.z * UE_M, V.y * UE_M);
	}
	FORCEINLINE FQuat ToUE(const bannon::Quat& Q)
	{
		// axis component follows the same Y<->Z swap; w unchanged.
		return FQuat(Q.x, Q.z, Q.y, Q.w).GetNormalized();
	}
	FORCEINLINE bannon::Quat ToNative(const FQuat& Q)
	{
		return bannon::Quat(Q.X, Q.Z, Q.Y, Q.W);
	}
}
