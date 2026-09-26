// Copyright BANNON.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BannonGGPONetwork.generated.h"

UCLASS(ClassGroup=(Bannon))
class BANNONCORE_API ABannonGGPONetwork : public AActor
{
	GENERATED_BODY()

public:
	ABannonGGPONetwork();

	UFUNCTION(BlueprintCallable, Category="Bannon|Netcode")
	void SyncRollbackFrame(int32 Frame, const TArray<uint8>& InputState);
};
