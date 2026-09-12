// Copyright BANNON.
#include "BannonArena.h"
#include "BannonBridge.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_universe.h"
#include "bannon_arena.h"
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

// ── CONTAINMENT ─────────────────────────────────────────────────────────────────────────────────
// bannon_arena.h has always carried the ring/open containment law and NOTHING in Unreal called it.
// UE bodies therefore had no boundary at all: no ropes, no rebound, no stage edge — a whipped body
// just kept travelling. The native law is the same one the web build runs, so wiring it here is what
// makes an Irish whip rebound in UE instead of leaving the building.

bannon::Arena ABannonArena::MakeNativeArena() const
{
	bannon::Arena A;
	A.mode = (Mode == EBannonArenaMode::Open) ? bannon::OPEN
	       : (Mode == EBannonArenaMode::Ring6) ? bannon::RING_6 : bannon::RING_4;
	// UE is cm + Z-up; the law is m + Y-up. Convert the DIMENSIONS on the seam too, not just the
	// vectors — feeding 350 (cm) into a law expecting metres is exactly how a ring ends up 350 m wide.
	A.floorY      = DeckHeight / BannonBridge::UE_M;
	A.halfSize    = RingHalfExtent / BannonBridge::UE_M;
	A.openHalf    = OpenHalfExtent / BannonBridge::UE_M;
	A.ropeY       = RopeHeight / BannonBridge::UE_M;
	A.restitution = Restitution;
	return A;
}

bool ABannonArena::Contain(FVector& Pos, FVector& Vel) const
{
	const bannon::Arena A = MakeNativeArena();

	// into the ring's own local frame first: the law is written around origin, and an arena actor
	// placed anywhere but 0,0 would otherwise contain bodies against the wrong walls.
	const FVector Origin = GetActorLocation();
	bannon::Vec3 P = BannonBridge::ToNative(Pos - Origin);
	bannon::Vec3 V = BannonBridge::ToNative(Vel);

	const bool bHit = A.contain(P, V);

	Pos = BannonBridge::ToUE(P) + Origin;
	Vel = BannonBridge::ToUE(V);
	return bHit;
}

bool ABannonArena::IsOutsideRing(FVector Pos) const
{
	if (Mode == EBannonArenaMode::Open)
	{
		return false;
	}
	const FVector L = Pos - GetActorLocation();
	return FMath::Abs(L.X) > RingHalfExtent || FMath::Abs(L.Y) > RingHalfExtent;
}

FVector ABannonArena::GetPostLocation(int32 PostIndex) const
{
	// corners in the same order the Posts array is built: (+,+) (-,+) (+,-) (-,-)
	static const int32 SX[4] = {  1, -1,  1, -1 };
	static const int32 SY[4] = {  1,  1, -1, -1 };
	const int32 i = FMath::Clamp(PostIndex, 0, 3);
	return GetActorLocation() + FVector(SX[i] * RingHalfExtent, SY[i] * RingHalfExtent, DeckHeight);
}

int32 ABannonArena::NearestPost(FVector Pos, float& OutDistance) const
{
	OutDistance = TNumericLimits<float>::Max();
	if (Mode == EBannonArenaMode::Open)
	{
		return -1;
	}
	int32 Best = -1;
	for (int32 i = 0; i < 4; ++i)
	{
		const float D = FVector::Dist2D(GetPostLocation(i), Pos);
		if (D < OutDistance)
		{
			OutDistance = D;
			Best = i;
		}
	}
	return Best;
}
