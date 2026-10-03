#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "llama.h"
#include "BannonLLMInference.generated.h"

UCLASS()
class BANNONCORE_API UBannonLLMInference : public UObject
{
	GENERATED_BODY()

public:
	UBannonLLMInference();
	~UBannonLLMInference();

	// Initialize the embedded llama.cpp context on the local machine
	UFUNCTION(BlueprintCallable, Category = "Bannon|EdgeAI")
	void InitializeLlama(const FString& ModelPath);

	// Generate ultra-low latency decision logic or dynamic commentary 
	UFUNCTION(BlueprintCallable, Category = "Bannon|EdgeAI")
	FString GenerateEdgeInference(const FString& ContextPrompt);

private:
	llama_context* LlamaCtx;
	llama_model* LlamaModel;
};
