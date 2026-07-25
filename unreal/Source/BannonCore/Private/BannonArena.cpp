// Copyright BANNON.
#include "BannonArena.h"
#include "BannonBridge.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_universe.h"
THIRD_PARTY_INCLUDES_END

ABannonArena::ABannonArena()
{
	PrimaryActorTick.bCanEverTick = false;
	Deck = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Deck"));
	RootComponent = Deck;

	// mat sits on the deck; 4 chrome posts + 12 accent turnbuckle pads (3 per post, like the web ring).
	Mat = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mat"));
	Mat->SetupAttachment(Deck);
	for (int32 i = 0; i < 4; ++i)
	{
		UStaticMeshComponent* P = CreateDefaultSubobject<UStaticMeshComponent>(*FString::Printf(TEXT("Post%d"), i));
		P->SetupAttachment(Deck); Posts.Add(P);
	}
	for (int32 i = 0; i < 12; ++i)
	{
		UStaticMeshComponent* Pad = CreateDefaultSubobject<UStaticMeshComponent>(*FString::Printf(TEXT("Pad%d"), i));
		Pad->SetupAttachment(Deck); Pads.Add(Pad);
	}
	Colors = FBannonRingColors::ForTheme(Theme);
}

void ABannonArena::ApplyThemeColors()
{
	// exact web palette onto dynamic material instances. Material assets (authored in-editor) are expected
	// to expose a "BaseColor" vector param + the chrome/matte scalar setup; here we push the colors so the
	// upgraded ring reads identical to the Three.js one (same accent/deck/post/mat + the BANNON mat logo).
	Colors = FBannonRingColors::ForTheme(Theme);
	auto Tint = [](UStaticMeshComponent* C, FColor Hex, float Metal, float Rough)
	{
		if (!C) return;
		if (UMaterialInstanceDynamic* MID = C->CreateAndSetMaterialInstanceDynamic(0))
		{
			MID->SetVectorParameterValue(TEXT("BaseColor"), FLinearColor(Hex));
			MID->SetScalarParameterValue(TEXT("Metallic"), Metal);
			MID->SetScalarParameterValue(TEXT("Roughness"), Rough);
		}
	};
	Tint(Deck, Colors.Deck, 0.08f, 0.82f);
	Tint(Mat,  Colors.MatBase, 0.0f, 0.88f);                 // matte canvas; the mat texture carries the logo + accent border
	for (UStaticMeshComponent* P : Posts) Tint(P, Colors.Post, 0.95f, 0.12f);   // chrome
	for (UStaticMeshComponent* Pad : Pads) Tint(Pad, Colors.Accent, 0.0f, 0.78f); // matte accent pads
}

float ABannonArena::PostImpact(int32 PostIndex, FVector BodyVel, FVector /*BodyPos*/) const
{
	// velocity toward the post (cm/s) -> m/s, capped, through DMG_SCALE (matches the web v153 env law).
	const float speed = BodyVel.Size() / BannonBridge::UE_M;
	const float v = FMath::Min(speed, bannon::MAX_BODY_VEL);
	if (v < 1.9f) return 0.f;               // too soft to register
	return v * bannon::DMG_SCALE * 1.4f;    // steel post is a hard surface
}

bool ABannonArena::TableImpact(float VictimMassKg, float DownVelY, float& OutPoiseShock, float& OutSpineDamage) const
{
	bannon::TableImpact r = bannon::tableImpact(VictimMassKg, DownVelY / BannonBridge::UE_M);
	OutPoiseShock = r.poiseShock; OutSpineDamage = r.spineDamage;
	return r.shattered;
}
