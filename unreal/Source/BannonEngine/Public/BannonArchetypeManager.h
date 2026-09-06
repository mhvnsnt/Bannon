// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonArchetypeManager.generated.h"

UENUM(BlueprintType)
enum class EBannonArchetype : uint8
{
    Powerhouse, Brawler, Striker, Technician, HighFlyer, FreeAgent
};

UCLASS()
class BANNONENGINE_API UBannonArchetypeManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="Bannon|Archetype") 
	void ApplyArchetype(AActor* Fighter, EBannonArchetype Archetype);
};
