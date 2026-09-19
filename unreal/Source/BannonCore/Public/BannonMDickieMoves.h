#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonMDickieMoves.generated.h"

UENUM(BlueprintType)
enum class EMDickieMoveCategory : uint8
{
    Position,
    Grapple,
    Strike,
    Submission,
    Aerial,
    Unknown
};

USTRUCT(BlueprintType)
struct FMDickieMoveMapping
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    FString BannonName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    FString MDickieLegacyName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    FString ActionType;
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|MDickie")
    EMDickieMoveCategory Category;
};

UCLASS()
class BANNONCORE_API UBannonMDickieMoves : public UObject
{
    GENERATED_BODY()

public:
    UBannonMDickieMoves();

    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    static TArray<FMDickieMoveMapping> GetLegacyMoveCatalog();
    
    UFUNCTION(BlueprintCallable, Category="Bannon|MDickie")
    static bool ValidateMoveExistence(FString MoveName);
};
