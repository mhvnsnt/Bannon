#include "BannonCommentaryEngine.h"

UBannonCommentaryEngine::UBannonCommentaryEngine() {
    PrimaryComponentTick.bCanEverTick = false;
    MomentumThreshold = 8.0f; // Linked to DMG_SCALE limit
}

void UBannonCommentaryEngine::RegisterMatchEvent(const FString& EventDescription, float ImpactForce) {
    MatchContextBuffer.Add(FString::Printf(TEXT("[%f] %s"), ImpactForce, *EventDescription));
    
    // If impact is extremely heavy, trigger immediate commentary synthesis
    if (ImpactForce >= MomentumThreshold * 0.75f) {
        TriggerLLMCommentaryGeneration();
    }
}

void UBannonCommentaryEngine::TriggerLLMCommentaryGeneration() {
    if (MatchContextBuffer.Num() == 0) return;

    FString ContextPayload = FString::Join(MatchContextBuffer, TEXT(" | "));
    MatchContextBuffer.Empty();

    DispatchToLocalLLMNode(ContextPayload);
}

void UBannonCommentaryEngine::DispatchToLocalLLMNode(const FString& ContextPayload) {
    // Native HTTP request to local TTS/LLM server (e.g., Ollama/Whisper locally)
    // Asynchronous request streaming audio byte arrays back into Unreal's Audio Component.
    // Offloaded to prevent physics tick blocking.
}
