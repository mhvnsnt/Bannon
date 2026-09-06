#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonMDickieWeaponImporter.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonMDickieWeaponImporter : public UActorComponent
{
    GENERATED_BODY()

public:
    UBannonMDickieWeaponImporter();

    UFUNCTION(BlueprintCallable, Category = "MDickie|Weapons")
    void ImportWeaponData(const FString& JsonPayload);

    UFUNCTION(BlueprintCallable, Category = "MDickie|Weapons")
    void ApplyWeaponPhysics(AActor* WeaponActor, float BaseMass, float DamageMultiplier);

protected:
    virtual void BeginPlay() override;
};
