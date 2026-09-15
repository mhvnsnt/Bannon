// Copyright BANNON.

#include "BannonGGPONetwork.h"

ABannonGGPONetwork::ABannonGGPONetwork()
{
	PrimaryActorTick.bCanEverTick = true;
}

void ABannonGGPONetwork::SyncRollbackFrame(int32 Frame, const TArray<uint8>& InputState)
{
	// Integration with open-source GGPO for frame-perfect peer-to-peer rollback
}
