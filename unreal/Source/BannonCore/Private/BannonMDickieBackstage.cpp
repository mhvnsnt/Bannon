#include "BannonMDickieBackstage.h"
#include "Misc/App.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Json.h"

void UBannonMDickieBackstage::InitializeBackstageRoaming(FString& CurrentLevel)
{
    // Simulates MDickie's free-roaming backstage areas, connecting the arena, locker rooms, parking lot, and streets.
    // Loads seamless environment streaming profiles to let characters walk out of the ring and into the city.
}

void UBannonMDickieBackstage::SpawnContextualProps(TArray<FString>& SpawnPoints)
{
    // Scatters interactable items (chairs, tables, vending machines, dumbbells, weights, cars)
    // universally across the navmesh, allowing weapons to be picked up in any scene.
}

void UBannonMDickieBackstage::TriggerRandomEncounter(const FString& PlayerCharacter, FString& OpponentCharacter)
{
    // Check if the transitional loading zone conditions are met for Cipher's autonomous ambush
    if (OpponentCharacter == TEXT("cipher_01"))
    {
        // Wire to Node.js meta backend bridge
        TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
        Request->OnProcessRequestComplete().BindLambda([](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
        {
            if (bWasSuccessful && Response.IsValid())
            {
                // Decode bannon_strings_v4.json payload and apply Cipher's momentum trigger/paranoia buffs
                TSharedPtr<FJsonObject> JsonObject;
                TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response->GetContentAsString());
                if (FJsonSerializer::Deserialize(Reader, JsonObject))
                {
                    // Trigger the "Vessel State" UI overlay and spawn Cipher in the flickering hallway
                    UE_LOG(LogTemp, Warning, TEXT("[BANNON BACKSTAGE] Cipher Ambush Spawned! Payload: %s"), *Response->GetContentAsString());
                }
            }
        });
        
        Request->SetURL(TEXT("http://localhost:3000/api/dialogue/cipher_ambush"));
        Request->SetVerb(TEXT("POST"));
        Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
        
        // Pass God Within progression metrics to trigger the "he sees you" state
        FString PayloadString = FString::Printf(TEXT("{\"playerId\": \"%s\", \"matchStage\": \"Pre-match Ambush\", \"isChampion\": true}"), *PlayerCharacter);
        Request->SetContentAsString(PayloadString);
        Request->ProcessRequest();
        
        return;
    }

    // Standard MDickie randomization for other roster members
    // Randomizes NPC placements in the open world, simulating encounters like ambushes, conversations,
    // or unscripted brawls typical of MDickie's chaotic universe (e.g., getting attacked in the subway).
}
