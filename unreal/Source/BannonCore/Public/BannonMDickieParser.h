// AI ORIENTATION BLOCK v114
#pragma once
#include "CoreMinimal.h"
#include "BannonMovesetLibrary.h"
#include "BannonMDickieParser.generated.h"

UCLASS(BlueprintType)
class BANNONCORE_API UBannonMDickieParser : public UObject {
    GENERATED_BODY()
public:
    // Parses MDickie Unity asset exports and remaps 2D/3D bone rotations to the Bannon UE5 skeleton.
    UFUNCTION(BlueprintCallable, Category = "Bannon|MDickie")
    static TArray<FMovesetSlot> ParseMDickieAssets(const FString& DirectoryPath);
};
