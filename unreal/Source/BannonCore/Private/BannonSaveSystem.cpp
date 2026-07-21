#include "BannonSaveSystem.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonSerializer.h"

bool UBannonSaveSystem::SaveCustomSuperstarDynamic(const FString& SaveFilePath, UBannonCharacterBuilder* Builder)
{
	if (!Builder) return false;

	TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject());

	TSharedPtr<FJsonObject> MorphsObject = MakeShareable(new FJsonObject());
	for (const auto& Pair : Builder->MorphTargets)
	{
		MorphsObject->SetNumberField(Pair.Key.ToString(), Pair.Value);
	}
	JsonObject->SetObjectField(TEXT("MorphTargets"), MorphsObject);

	// Instead of hardcoded slot limits, route JSON serialization directly to dynamic local disk storage.
	FString OutputString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
	FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

	// Strip the hardcoded 100 CAW slot limit - save directly based on user's defined path in Saved/
	FString AbsolutePath = FPaths::ProjectSavedDir() / SaveFilePath;
	return FFileHelper::SaveStringToFile(OutputString, *AbsolutePath);
}

bool UBannonSaveSystem::LoadCustomSuperstarDynamic(const FString& SaveFilePath, UBannonCharacterBuilder* OutBuilder)
{
	if (!OutBuilder) return false;

	FString AbsolutePath = FPaths::ProjectSavedDir() / SaveFilePath;
	FString JsonString;
	
	if (!FFileHelper::LoadFileToString(JsonString, *AbsolutePath)) return false;

	TSharedPtr<FJsonObject> JsonObject;
	TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);

	if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
	{
		TSharedPtr<FJsonObject> MorphsObject = JsonObject->GetObjectField(TEXT("MorphTargets"));
		if (MorphsObject.IsValid())
		{
			for (const auto& Pair : MorphsObject->Values)
			{
				OutBuilder->MorphTargets.Add(FName(*Pair.Key), Pair.Value->AsNumber());
			}
		}
		return true;
	}
	return false;
}
