#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonInvertedPiledriverConstraint.generated.h"

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonInvertedPiledriverConstraint : public UActorComponent
{
    GENERATED_BODY()

public:
    UBannonInvertedPiledriverConstraint();

    // Establishes the Tombstone/Piledriver physics lock
    // Defender is inverted (Z-axis flip) and constrained to Attacker's pelvis/torso
    UFUNCTION(BlueprintCallable, Category = "Physics|Grapple")
    void EstablishInvertedHold(AActor* Attacker, AActor* Defender);

    // Releases the lock and drives defender head-first into the canvas
    UFUNCTION(BlueprintCallable, Category = "Physics|Grapple")
    void ExecuteDriver(AActor* Attacker, AActor* Defender);
};
