#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonDriveMechanic.generated.h"

UCLASS()
class BANNONCORE_API UBannonDriveMechanic : public UObject
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Drive")
    float CurrentDrive; // 0.0 to 100.0

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Drive")
    float MaxDrive = 100.0f;

    UFUNCTION(BlueprintCallable, Category="Bannon|Drive")
    void AddDrive(float Amount);

    UFUNCTION(BlueprintCallable, Category="Bannon|Drive")
    bool ConsumeDrive(float Amount);

    UFUNCTION(BlueprintCallable, Category="Bannon|Drive")
    float CalculateDriveMultiplier(float BaseDamage);
};
