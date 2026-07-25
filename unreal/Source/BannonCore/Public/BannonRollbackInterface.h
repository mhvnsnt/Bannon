#pragma once
#include "CoreMinimal.h"
#include "UObject/Interface.h"
#include "BannonRollbackInterface.generated.h"

UINTERFACE(MinimalAPI)
class UBannonRollbackInterface : public UInterface {
    GENERATED_BODY()
};

class BANNONCORE_API IBannonRollbackInterface {
    GENERATED_BODY()
public:
    virtual void SerializeState(TArray<uint8>& OutBuffer) = 0;
    virtual void DeserializeState(const TArray<uint8>& InBuffer) = 0;
    virtual void SnapToFrame(float AnimSequenceTime, float CurrentBlendWeight) = 0;
};
