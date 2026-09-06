#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "BannonJigglePhysicsComponent.generated.h"

USTRUCT(BlueprintType)
struct FJiggleBone {
    GENERATED_BODY()
    FName BoneName;
    FVector CurrentPos;
    FVector Velocity;
};

UCLASS(ClassGroup=(BannonPhysics), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonJigglePhysicsComponent : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonJigglePhysicsComponent();
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;
    UFUNCTION(BlueprintCallable, Category = "Bannon|Physics")
    void AutoDetectJiggleBones(USkeletalMeshComponent* InTargetMesh);
    UPROPERTY(EditAnywhere, Category = "Bannon|Physics")
    float Stiffness = 150.0f;
    UPROPERTY(EditAnywhere, Category = "Bannon|Physics")
    float Damping = 0.1f;
    UPROPERTY(EditAnywhere, Category = "Bannon|Physics")
    float MaxDeformation = 15.0f;
    UPROPERTY()
    USkeletalMeshComponent* TargetMesh;
private:
    TArray<FJiggleBone> JiggleBones;
};
