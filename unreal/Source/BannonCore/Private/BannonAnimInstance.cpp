#include "BannonAnimInstance.h"

UBannonAnimInstance::UBannonAnimInstance()
{
	CurrentPoise = 100.0f;
	bIsCrumpled = false;
	GGPOFrame = 0;
	GrappleIKBridge = nullptr;
	GGPOBridge = nullptr;
}

void UBannonAnimInstance::NativeInitializeAnimation()
{
	Super::NativeInitializeAnimation();
}

void UBannonAnimInstance::NativeUpdateAnimation(float DeltaSeconds)
{
	Super::NativeUpdateAnimation(DeltaSeconds);

	// Physics Boundaries: The animation system is subordinate to the poise engine.
	// If poise drops below 0, the character is crumpled by Jolt.
	
	if (GrappleIKBridge)
	{
		// E.g., fetch poise state from a native component or directly if the bridge exposed it
		// For now we simulate reading the state to bind animation blending to the physics crumple state
		// If poise is 0, we're in full Jolt physics override
		bIsCrumpled = (CurrentPoise <= 0.0f);
	}

	if (GGPOBridge && GGPOBridge->RollbackSession)
	{
		// Route the skeletal animation graph to read active frame data directly from GGPO
		// Note: actual API call depends on ggpo bindings. 
		// Example pseudo-sync:
		// GGPOFrame = ggpo_get_current_frame(GGPOBridge->RollbackSession);
	}
}
