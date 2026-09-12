#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonVerletClothComponent.generated.h"

USTRUCT(BlueprintType)
struct FClothNode {
    GENERATED_BODY()
    FVector Position;
    FVector PreviousPosition;
    bool bIsPinned;
    FName AnchorBone; // "Pelvis" or "Chest"
};

USTRUCT(BlueprintType)
struct FClothConstraint {
    GENERATED_BODY()
    int32 NodeA;
    int32 NodeB;
    float RestLength;
};

// Brick 55: SecondaryPhysicsSystem for capes and loincloths
UCLASS(ClassGroup=(BannonPhysics), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonVerletClothComponent : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonVerletClothComponent();

    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void InitializeCloth(const TArray<FVector>& InitialPositions, const TArray<FClothConstraint>& InitialConstraints);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void AnchorToFighter(FName BoneName, int32 NodeIndex);

    UPROPERTY(EditAnywhere, Category = "Bannon|Physics")
    float Damping = 0.02f;

    UPROPERTY(EditAnywhere, Category = "Bannon|Physics")
    float GravityScale = 1.0f;

    UPROPERTY(EditAnywhere, Category = "Bannon|Physics")
    float Stiffness = 0.95f;

    UPROPERTY(EditAnywhere, Category = "Bannon|Physics")
    int32 ConstraintIterations = 5;

private:
    TArray<FClothNode> Nodes;
    TArray<FClothConstraint> Constraints;
};
