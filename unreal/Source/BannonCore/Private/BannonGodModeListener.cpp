#include "BannonGodModeListener.h"
#include "Async/Async.h"
#include "Sockets.h"
#include "SocketSubsystem.h"
#include "Interfaces/IPv4/IPv4Address.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

UBannonGodModeListener::UBannonGodModeListener() {
    PrimaryComponentTick.bCanEverTick = false;
    bIsListening = false;
    ListenSocket = nullptr;
}

void UBannonGodModeListener::BeginPlay() {
    Super::BeginPlay();
    StartUDPListener();
}

void UBannonGodModeListener::EndPlay(const EEndPlayReason::Type EndPlayReason) {
    bIsListening = false;
    if (ListenSocket) {
        ListenSocket->Close();
        ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->DestroySocket(ListenSocket);
        ListenSocket = nullptr;
    }
    Super::EndPlay(EndPlayReason);
}

void UBannonGodModeListener::StartUDPListener() {
    ListenSocket = ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->CreateSocket(NAME_DGram, TEXT("GodModeListener"), false);
    if (!ListenSocket) return;

    TSharedRef<FInternetAddr> Addr = ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->CreateInternetAddr();
    Addr->SetAnyAddress();
    Addr->SetPort(4001);

    if (ListenSocket->Bind(*Addr)) {
        bIsListening = true;
        
        Async(EAsyncExecution::ThreadPool, [this]() {
            while (bIsListening && ListenSocket) {
                ReceiveUDPData();
                FPlatformProcess::Sleep(0.01f);
            }
        });
    } else {
        ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->DestroySocket(ListenSocket);
        ListenSocket = nullptr;
    }
}

void UBannonGodModeListener::ReceiveUDPData() {
    uint32 Size;
    while (ListenSocket && ListenSocket->HasPendingData(Size)) {
        TArray<uint8> ReceivedData;
        ReceivedData.SetNumUninitialized(FMath::Min(Size, 65507u));
        
        int32 Read = 0;
        TSharedRef<FInternetAddr> Sender = ISocketSubsystem::Get(PLATFORM_SOCKETSUBSYSTEM)->CreateInternetAddr();
        
        if (ListenSocket->RecvFrom(ReceivedData.GetData(), ReceivedData.Num(), Read, *Sender)) {
            ReceivedData.Add(0); // Null terminator
            FString Payload = UTF8_TO_TCHAR(ReceivedData.GetData());
            
            // Push safely to Game Thread
            AsyncTask(ENamedThreads::GameThread, [this, Payload]() {
                ApplyGodModeCommand(Payload);
            });
        }
    }
}

void UBannonGodModeListener::ApplyGodModeCommand(const FString& JsonPayload) {
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonPayload);

    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid()) {
        FString Command = JsonObject->GetStringField("command");
        const TSharedPtr<FJsonObject>* PayloadObj = nullptr;
        
        if (JsonObject->TryGetObjectField("payload", PayloadObj) && PayloadObj && (*PayloadObj).IsValid()) {
            TSharedPtr<FJsonObject> Payload = *PayloadObj;
            
            if (Command == "OVERRIDE_PHYSICS") {
                if (Payload->HasField("MAX_HP")) {
                    float MaxHp = Payload->GetNumberField("MAX_HP");
                    UE_LOG(LogTemp, Warning, TEXT("God Mode: MAX_HP overridden to %f"), MaxHp);
                }
                if (Payload->HasField("DMG_SCALE")) {
                    float DmgScale = Payload->GetNumberField("DMG_SCALE");
                    UE_LOG(LogTemp, Warning, TEXT("God Mode: DMG_SCALE overridden to %f"), DmgScale);
                }
                if (Payload->HasField("MAX_BODY_VEL")) {
                    float MaxVel = Payload->GetNumberField("MAX_BODY_VEL");
                    UE_LOG(LogTemp, Warning, TEXT("God Mode: MAX_BODY_VEL overridden to %f"), MaxVel);
                }
                if (Payload->HasField("POISE_STATE")) {
                    FString PoiseState = Payload->GetStringField("POISE_STATE");
                    UE_LOG(LogTemp, Warning, TEXT("God Mode: POISE_STATE overridden to %s"), *PoiseState);
                }
                if (Payload->HasField("CRUMPLE_STATE")) {
                    FString CrumpleState = Payload->GetStringField("CRUMPLE_STATE");
                    UE_LOG(LogTemp, Warning, TEXT("God Mode: CRUMPLE_STATE overridden to %s"), *CrumpleState);
                }
            }
        }
    }
}
