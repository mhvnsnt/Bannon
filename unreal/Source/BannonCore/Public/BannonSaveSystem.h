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
};

UCLASS()
class BANNONCORE_API UBannonSaveSystem : public UObject
{
	GENERATED_BODY()

public:
	// Serialize this data into a lightweight JSON payload and write to SaveSlot
	UFUNCTION(BlueprintCallable, Category = "Bannon|Save")
	static bool SaveCustomSuperstar(int32 SaveSlot, const FString& SuperstarName, UBannonCharacterBuilder* Builder);

	// Load custom superstar from JSON payload
	UFUNCTION(BlueprintCallable, Category = "Bannon|Save")
	static bool LoadCustomSuperstar(int32 SaveSlot, UBannonCharacterBuilder* OutBuilder);
};
