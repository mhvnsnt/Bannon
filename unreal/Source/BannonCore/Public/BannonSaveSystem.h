#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonCharacterBuilder.h"
#include "BannonSaveSystem.generated.h"

USTRUCT(BlueprintType)
struct FCustomSuperstarData
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadWrite, Category = "Bannon|Save")
	FString SuperstarName;

	UPROPERTY(BlueprintReadWrite, Category = "Bannon|Save")
	TMap<FName, float> MorphTargets;
	
	// Support up to 4 alternate attire sub-routes within the single base file
	UPROPERTY(BlueprintReadWrite, Category = "Bannon|Save")
	TArray<FString> AttirePayloads;
};

UCLASS()
class BANNONCORE_API UBannonSaveSystem : public UObject
{
	GENERATED_BODY()

public:
	// Dynamic Serialization to local disk - Killing the 100 CAW cap
	UFUNCTION(BlueprintCallable, Category = "Bannon|Save")
	static bool SaveCustomSuperstarDynamic(const FString& SaveFilePath, UBannonCharacterBuilder* Builder);

	UFUNCTION(BlueprintCallable, Category = "Bannon|Save")
	static bool LoadCustomSuperstarDynamic(const FString& SaveFilePath, UBannonCharacterBuilder* OutBuilder);
};
