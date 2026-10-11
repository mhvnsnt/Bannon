#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonOntologicalTreeCore.generated.h"

UCLASS(ClassGroup=(Bannon), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonOntologicalTreeCore : public UActorComponent
{
    GENERATED_BODY()
public:
    UBannonOntologicalTreeCore();
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ontology")
    float AuraResonance;
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ontology")
    int32 EgoDissolution;
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Ontology")
    float GreedMultiplier;

    UFUNCTION(BlueprintCallable, Category="Bannon|RPG")
    void MutateAlignment(float DeltaAura, int32 DeltaEgo, float DeltaGreed);

    UFUNCTION(BlueprintCallable, Category="Bannon|Physics")
    void ApplyOntologicalPoiseModifiers(class UPrimitiveComponent* PhysicsComp);
};
