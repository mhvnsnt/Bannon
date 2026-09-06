#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "BannonSoundtrackEngine.generated.h"

USTRUCT(BlueprintType)
struct FBannonAudioTrack {
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString TrackID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Title;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Artist;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString FilePath;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString TrackType; // e.g. menu, entrance, game
};

UCLASS()
class BANNONCORE_API UBannonSoundtrackEngine : public UObject
{
    GENERATED_BODY()

public:
    UBannonSoundtrackEngine();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Soundtrack")
    TArray<FBannonAudioTrack> Playlist;

    UFUNCTION(BlueprintCallable, Category = "Bannon|Audio")
    void InitializeMHeavenSentTracks();

    UFUNCTION(BlueprintCallable, Category = "Bannon|Audio")
    void PlayTrack(const FString& TrackID);
};
