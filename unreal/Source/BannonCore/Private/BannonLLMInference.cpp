#include "BannonLLMInference.h"

UBannonLLMInference::UBannonLLMInference()
{
	LlamaCtx = nullptr;
	LlamaModel = nullptr;
}

UBannonLLMInference::~UBannonLLMInference()
{
	if (LlamaCtx)
	{
		llama_free(LlamaCtx);
	}
	if (LlamaModel)
	{
		llama_free_model(LlamaModel);
	}
}

void UBannonLLMInference::InitializeLlama(const FString& ModelPath)
{
	llama_model_params model_params = llama_model_default_params();
	LlamaModel = llama_load_model_from_file(TCHAR_TO_UTF8(*ModelPath), model_params);
	
	if (LlamaModel)
	{
		llama_context_params ctx_params = llama_context_default_params();
		LlamaCtx = llama_new_context_with_model(LlamaModel, ctx_params);
	}
}

FString UBannonLLMInference::GenerateEdgeInference(const FString& ContextPrompt)
{
	if (!LlamaCtx) return FString(TEXT("ERROR: Llama context not initialized."));
	
	// Fast generation loop using llama.cpp bindings would go here
	// Direct execution bypassing external server latency for combat AI decisions
	
	return FString(TEXT("INFERENCE_SUCCESS"));
}
