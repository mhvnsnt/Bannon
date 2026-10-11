// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonSubmissionManager.generated.h"

UCLASS()
class BANNONENGINE_API UBannonSubmissionManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Submission") 
	void InitiateSubmission(AActor* Attacker, AActor* Defender);

    UPROPERTY(BlueprintReadOnly, Category="Bannon|Submission")
    float StruggleValue = 50.0f;
};
