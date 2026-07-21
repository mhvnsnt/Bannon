#include "BannonTelemetryLogger.h"
#include "Async/Async.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"

UBannonTelemetryLogger::UBannonTelemetryLogger() {
    PrimaryComponentTick.bCanEverTick = false;
}

void UBannonTelemetryLogger::BeginPlay() {
    Super::BeginPlay();
    LogFilePath = FPaths::ProjectSavedDir() / TEXT("Analytics") / TEXT("MatchTelemetry_") + FDateTime::Now().ToString() + TEXT(".json");
}

void UBannonTelemetryLogger::LogMatchEvent(const FString& EventType, FName BoneTarget, float ForceValue, float NewPoise) {
    FString Payload = FString::Printf(TEXT("{\"timestamp\":%f, \"event\":\"%s\", \"bone\":\"%s\", \"force\":%f, \"poise\":%f}\n"),
        FPlatformTime::Seconds(), *EventType, *BoneTarget.ToString(), ForceValue, NewPoise);
    
    WriteToJsonAsync(Payload);
}

void UBannonTelemetryLogger::WriteToJsonAsync(const FString& Payload) {
    FString SafePath = LogFilePath;
    Async(EAsyncExecution::ThreadPool, [SafePath, Payload]() {
        // Asynchronous file I/O ensuring zero blocking on the physics thread
        FFileHelper::SaveStringToFile(Payload, *SafePath, FFileHelper::EEncodingOptions::AutoDetect, &IFileManager::Get(), FILEWRITE_Append);
    });
}
