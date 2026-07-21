#include "BannonAPIBridge.h"
#include "Serialization/JsonSerializer.h"

UBannonAPIBridge::UBannonAPIBridge() {
    PrimaryComponentTick.bCanEverTick = true;
    ActiveBuilder = nullptr;
}

void UBannonAPIBridge::BeginPlay() {
    Super::BeginPlay();
}

void UBannonAPIBridge::EndPlay(const EEndPlayReason::Type EndPlayReason) {
    StopLocalServer();
    Super::EndPlay(EndPlayReason);
}

void UBannonAPIBridge::StartLocalServer(int32 Port) {
    // Initializes FSocket and listens on designated Port (e.g., 8080)
    // for incoming TCP/WebSocket connections over the secure Tailscale tunnel.
    // Offloads listener blocking loops to secondary threads to protect the Jolt tick.
}

void UBannonAPIBridge::StopLocalServer() {
    // Gracefully shut down socket listeners and clear active network threads.
}

void UBannonAPIBridge::ProcessIncomingJSONPayload(const FString& JsonPayload) {
    if (!ActiveBuilder) return;

    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonPayload);

    // Parses realtime WebUI commands locally mapped from the mobile client
    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid()) {
        FString CommandType;
        if (JsonObject->TryGetStringField(TEXT("CommandType"), CommandType)) {
            if (CommandType == TEXT("UpdateMorph")) {
                RouteMorphUpdate(JsonObject);
            } else if (CommandType == TEXT("UpdateMaterial")) {
                RouteMaterialUpdate(JsonObject);
            } else if (CommandType == TEXT("SaveCAW")) {
                RouteSaveCommand(JsonObject);
            }
        }
    }
}

void UBannonAPIBridge::RouteMorphUpdate(const TSharedPtr<FJsonObject>& JsonObject) {
    if (!ActiveBuilder) return;
    FString MorphName = JsonObject->GetStringField(TEXT("MorphName"));
    float MorphValue = JsonObject->GetNumberField(TEXT("MorphValue"));
    
    // Updates internal maps and recalculates Poise/Velocity constraints instantly
    ActiveBuilder->MorphTargets.Add(FName(*MorphName), MorphValue);
    ActiveBuilder->ApplyMorphAndSyncPhysics(); // Synchronizes Jolt constraints
}

void UBannonAPIBridge::RouteMaterialUpdate(const TSharedPtr<FJsonObject>& JsonObject) {
    if (!ActiveBuilder || !ActiveBuilder->MeshCompositor) return;
    int32 LayerIndex = JsonObject->GetIntegerField(TEXT("LayerIndex"));
    FString MaterialType = JsonObject->GetStringField(TEXT("MaterialType"));
    
    FAttireMaterialOverride MatProps;
    MatProps.bIsVinyl = (MaterialType == TEXT("Vinyl"));
    MatProps.Metallic = (MaterialType == TEXT("Metallic") || MaterialType == TEXT("Leather")) ? 1.0f : 0.0f;
    MatProps.Roughness = (MaterialType == TEXT("Matte")) ? 1.0f : (MaterialType == TEXT("Gloss") ? 0.1f : 0.5f);
    
    ActiveBuilder->MeshCompositor->ApplyAttireMaterialOverride(LayerIndex, MatProps);
}

void UBannonAPIBridge::RouteSaveCommand(const TSharedPtr<FJsonObject>& JsonObject) {
    if (!ActiveBuilder) return;
    FString SaveFileName = JsonObject->GetStringField(TEXT("FileName"));
    UBannonSaveSystem::SaveCustomSuperstarDynamic(SaveFileName, ActiveBuilder);
}
