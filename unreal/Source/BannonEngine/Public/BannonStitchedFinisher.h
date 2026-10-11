// Copyright BANNON.
#pragma once
#include "CoreMinimal.h"
#include "BannonMovesetLibraryAsset.h"
#include "BannonStitchedFinisher.generated.h"

USTRUCT(BlueprintType)
struct FFinisherSegment
{
    GENERATED_BODY()
    UPROPERTY(EditAnywhere, BlueprintReadWrite) TSoftObjectPtr<UAnimMontage> SegmentMontage;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float BlendInTime;
};

UCLASS(BlueprintType)
class BANNONENGINE_API UBannonStitchedFinisher : public UMovesetLibraryAsset
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FFinisherSegment> FinisherSegments;
};
