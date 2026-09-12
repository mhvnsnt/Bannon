#include "BannonPromoInterview.h"

void UBannonPromoInterview::GenerateAmbushInterviewPrompt(const FString& WrestlerName, const FString& CurrentRival, float AngerLevel, FString& OutLLMPrompt)
{
    // Generates prompt for LLM engine mimicking MDickie's backstage sandbox ambushes
    FString Mood = AngerLevel > 75.0f ? TEXT("furious") : TEXT("confident");
    OutLLMPrompt = FString::Printf(TEXT("You are %s. You were just ambushed by a journalist backstage. You are feeling %s. Give a short, unhinged wrestling promo about your rival, %s."), *WrestlerName, *Mood, *CurrentRival);
}
