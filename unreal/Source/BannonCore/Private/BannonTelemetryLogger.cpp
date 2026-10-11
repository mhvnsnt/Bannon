#include "BannonTelemetryLogger.h"
#include "Async/Async.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Sockets.h"
#include "SocketSubsystem.h"
#include "Interfaces/IPv4/IPv4Address.h"

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
    BroadcastUdpAsync(Payload);
}

void UBannonTelemetryLogger::WriteToJsonAsync(const FString& Payload) {
    FString SafePath = LogFilePath;
    Async(EAsyncExecution::ThreadPool, [SafePath, Payload]() {
        // Asynchronous file I/O ensuring zero blocking on the physics thread
        FFileHelper::SaveStringToFile(Payload, *SafePath, FFileHelper::EEncodingOptions::AutoDetect, &IFileManager::Get(), FILEWRITE_Append);
    });
}

void UBannonTelemetryLogger::BroadcastUdpAsync(const FString& Payload) {
    Async(EAsyncExecution::ThreadPool, [Payload]() {
        FSocket* Socket = ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->CreateSocket(NAME_DGram, TEXT("default"), false);
        if (Socket) {
            TSharedRef<FInternetAddr> Addr = ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->CreateInternetAddr();
            bool bIsValid;
            Addr->SetIp(TEXT("127.0.0.1"), bIsValid);
            Addr->SetPort(4000);

            int32 BytesSent = 0;
            FTCHARToUTF8 Convert(*Payload);
            Socket->SendTo((uint8*)Convert.Get(), Convert.Length(), BytesSent, *Addr);
            
            Socket->Close();
            ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->DestroySocket(Socket);
        }
    });
}
