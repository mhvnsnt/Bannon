#include "BannonDNAParser.h"
#include "BannonRiggingStabilizer.h"
#include "Serialization/JsonSerializer.h"

UBannonDNAParser::UBannonDNAParser() {
    PrimaryComponentTick.bCanEverTick = false;
    
    // AGENTS.md: DO NOT make models for Cipher, Echo, Static, Hollow, or Onyx teammate.
    ExcludedRoster = { TEXT("Cipher"), TEXT("Echo"), TEXT("Static"), TEXT("Hollow"), TEXT("Onyx_Teammate") };
}

bool UBannonDNAParser::ValidateRosterExclusion(const FString& CharacterName) {
    for (const FString& Excluded : ExcludedRoster) {
        if (CharacterName.Equals(Excluded, ESearchCase::IgnoreCase)) {
            return false; // Character is strictly reserved for the user (Marquis)
        }
    }
    return true; // Eligible for automatic Tripo 3D GLB generation
}

void UBannonDNAParser::IngestRuntimeDNAPayload(const FString& JsonPayload, USkeletalMeshComponent* TargetMesh) {
    if (!TargetMesh) return;

    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonPayload);

    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid()) {
        FString CharName = JsonObject->GetStringField(TEXT("CharacterName"));
        
        // 1. Verification Lock
        if (!ValidateRosterExclusion(CharName)) return;

        // 2. Decode DNA Vector Arrays (Scale, Muscle Mass, Height)
        // [Logic maps JSON arrays directly into USkeletalMeshComponent bone transforms]

        // 3. Enforce Rigging Stability on incoming Tripo 3D GLB data
        UBannonRiggingStabilizer::ApplyAnatomicalWeightClamps(TargetMesh);
        UBannonRiggingStabilizer::PruneWeakInfluences(TargetMesh, 0.05f, 3);
    }
}
