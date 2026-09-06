#include "BannonGGPOBridge.h"

UBannonGGPOBridge::UBannonGGPOBridge()
{
	RollbackSession = nullptr;
}

void UBannonGGPOBridge::InitializeRollbackSession(int32 LocalPort, int32 NumPlayers)
{
	GGPOSessionCallbacks cb = { 0 };
	
	// Bind Bannon rollback state save/load functions to GGPO
	/*
	cb.begin_game = &BeginGameCallback;
	cb.save_game_state = &SaveGameStateCallback;
	cb.load_game_state = &LoadGameStateCallback;
	cb.log_game_state = &LogGameStateCallback;
	cb.free_buffer = &FreeBufferCallback;
	cb.advance_frame = &AdvanceFrameCallback;
	cb.on_event = &OnEventCallback;
	*/
	
	GGPOSession* session;
	GGPOErrorCode result = ggpo_start_session(&session, &cb, "bannon_core", NumPlayers, sizeof(int32), LocalPort);
	
	if (result == GGPO_OK)
	{
		RollbackSession = session;
	}
}

void UBannonGGPOBridge::SynchronizeKinematicInputs(int32 LocalInput, int32& OutSynchronizedInput, bool& bShouldRollback)
{
	if (!RollbackSession) return;
	
	// Example synchronization logic bypassing Unreal's default replication
	// ggpo_add_local_input(RollbackSession, ...);
	// ggpo_synchronize_input(RollbackSession, ...);
	bShouldRollback = false;
}

void UBannonGGPOBridge::AdvanceKinematicFrame()
{
	if (RollbackSession)
	{
		ggpo_advance_frame(RollbackSession);
		// This drives the native/ physics combat laws deterministically 
	}
}
