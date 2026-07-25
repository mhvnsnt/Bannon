// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonChainWrestlingManager.generated.h"

UCLASS()
class BANNONENGINE_API UBannonChainWrestlingManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Chain") 
	void StartChainWrestling(AActor* F1, AActor* F2);

    UPROPERTY(BlueprintReadOnly, Category="Bannon|Chain")
    bool bIsChainWrestling = false;
};
