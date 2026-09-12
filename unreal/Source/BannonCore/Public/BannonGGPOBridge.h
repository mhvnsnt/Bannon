#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "ggponet.h"
#include "BannonGGPOBridge.generated.h"

UCLASS()
class BANNONCORE_API UBannonGGPOBridge : public UObject
{
	GENERATED_BODY()

public:
	UBannonGGPOBridge();

	// Active instance of GGPO Rollback session
	GGPOSession* RollbackSession;

	// Anchors to KinematicCore integration
	UFUNCTION(BlueprintCallable, Category = "Bannon|Netcode")
	void InitializeRollbackSession(int32 LocalPort, int32 NumPlayers);

	// Pushes local controller state into GGPO and receives synchronized inputs
	UFUNCTION(BlueprintCallable, Category = "Bannon|Netcode")
	void SynchronizeKinematicInputs(int32 LocalInput, int32& OutSynchronizedInput, bool& bShouldRollback);

	// Core tick logic: Steps KinematicCore forward using GGPO synced frames
	UFUNCTION(BlueprintCallable, Category = "Bannon|Netcode")
	void AdvanceKinematicFrame();
};
