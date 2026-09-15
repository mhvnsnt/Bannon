// Copyright BANNON.
#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "BannonEntranceAsset.generated.h"

USTRUCT(BlueprintType)
struct FSequenceNode
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float StartTime;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) TSoftObjectPtr<UAnimMontage> NodeMontage;
};

UCLASS(BlueprintType)
class BANNONENGINE_API UBannonEntranceAsset : public UPrimaryDataAsset
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FSequenceNode> SequenceNodes;
};
