#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonEnvironmentalTrap.generated.h"

UENUM(BlueprintType)
enum class EBannonTrapType : uint8 
{ 
    ElectricalPanel, 
    VendingMachine, 
    Dumpster, 
    GlassWindow 
};

UCLASS()
class BANNONCORE_API UBannonEnvironmentalTrap : public UObject
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Bannon|Sandbox")
    void TriggerTrapReaction(EBannonTrapType TrapType, float ImpactForce, UPARAM(ref) float& ResultingDamage, UPARAM(ref) FString& StatusEffect);
};
