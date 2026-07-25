#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "BannonCharacterBuilder.h"
#include "BannonSaveSystem.h"
#include "BannonAPIBridge.generated.h"

UCLASS(ClassGroup=(BannonNetwork), meta=(BlueprintSpawnableComponent))
class BANNONCORE_API UBannonAPIBridge : public UActorComponent {
    GENERATED_BODY()
public:
    UBannonAPIBridge();
    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Network")
    void StartLocalServer(int32 Port = 8080);

    UFUNCTION(BlueprintCallable, Category = "Bannon|Network")
    void StopLocalServer();

    // High-speed JSON intake for mobile WebUI / Tailscale streaming
    UFUNCTION(BlueprintCallable, Category = "Bannon|Network")
    void ProcessIncomingJSONPayload(const FString& JsonPayload);

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bannon|Network")
    UBannonCharacterBuilder* ActiveBuilder;

private:
    void RouteMorphUpdate(const TSharedPtr<class FJsonObject>& JsonObject);
    void RouteMaterialUpdate(const TSharedPtr<class FJsonObject>& JsonObject);
    void RouteSaveCommand(const TSharedPtr<class FJsonObject>& JsonObject);
};
