#include "BannonSaveSystem.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonSerializer.h"

bool UBannonSaveSystem::SaveCustomSuperstar(int32 SaveSlot, const FString& SuperstarName, UBannonCharacterBuilder* Builder)
{
	if (!Builder) return false;

	TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject());
	JsonObject->SetStringField(TEXT("SuperstarName"), SuperstarName);

	TSharedPtr<FJsonObject> MorphsObject = MakeShareable(new FJsonObject());
	for (const auto& Pair : Builder->MorphTargets)
	{
		MorphsObject->SetNumberField(Pair.Key.ToString(), Pair.Value);
	}
	JsonObject->SetObjectField(TEXT("MorphTargets"), MorphsObject);

	FString OutputString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
	FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

	FString SavePath = FPaths::ProjectSavedDir() / FString::Printf(TEXT("CustomSuperstars/Slot_%d.json"), SaveSlot);
	return FFileHelper::SaveStringToFile(OutputString, *SavePath);
}

bool UBannonSaveSystem::LoadCustomSuperstar(int32 SaveSlot, UBannonCharacterBuilder* OutBuilder)
{
	if (!OutBuilder) return false;

	FString SavePath = FPaths::ProjectSavedDir() / FString::Printf(TEXT("CustomSuperstars/Slot_%d.json"), SaveSlot);
	FString JsonString;
	
	if (!FFileHelper::LoadFileToString(JsonString, *SavePath)) return false;

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
