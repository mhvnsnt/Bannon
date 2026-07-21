#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonDNAParser.generated.h"

UCLASS(ClassGroup=(BannonCAW), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonDNAParser : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonDNAParser();

    // Ingests Tripo 3D / Open-source GLB morph JSON structures
    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    void IngestRuntimeDNAPayload(const FString& JsonPayload, class USkeletalMeshComponent* TargetMesh);

    UFUNCTION(BlueprintCallable, Category = "Bannon|CAW")
    bool ValidateRosterExclusion(const FString& CharacterName);

private:
    TArray<FString> ExcludedRoster;
};
