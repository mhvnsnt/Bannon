// Copyright BANNON.
// The arena: elevated ring deck + 4 posts + turnbuckles + verlet-style ropes + the bowl/crowd. Meshes
// come from the Tripo environment set (assets/reference/env_snapshots seeds) as Static/Skeletal meshes;
// ring-post/step/table impacts are live surfaces (native env-contact + tableImpact laws). Ropes stay a
// lightweight physics constraint chain (the one thing kept procedural, like the web verlet ropes).
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BannonArena.generated.h"

class UStaticMeshComponent;

// ring theme — mirrors the web engine's arenaIdx (0 fire / 1 cold / 2 void).
UENUM(BlueprintType)
enum class EBannonRingTheme : uint8 { Fire, Cold, Void };

// EXACT ring palette carried over from the Three.js ring (BANNON_v150.html buildArena) so the upgraded
// high-fidelity ring reads identical — same accent, deck, post, mat, pad colors, per the owner's ask to
// "keep all the colors and the Bannon logo ... just like our three.js ring but better fidelity."
// Hex values are the literal ones from buildArena()/buildRingMatTexture() (documented per field).
USTRUCT(BlueprintType)
struct FBannonRingColors
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FColor Floor  = FColor(0x2a,0x1a,0x14);  // fire floorCol 0x2a1a14
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FColor Accent = FColor(0xff,0x45,0x00);  // fire accentCol 0xff4500 (ropes/pads/outline/logo)
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FColor Deck   = FColor(0x26,0x26,0x2e);  // ring deck 0x26262e
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FColor Post   = FColor(0x88,0x88,0x94);  // chrome post 0x888894 (metal 0.95, rough 0.12)
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FColor MatBase= FColor(0x2c,0x24,0x20);  // mat canvas base #2c2420

	// theme presets matching arenaIdx (fire default; cold blue; void purple).
	static FBannonRingColors ForTheme(EBannonRingTheme T)
	{
		FBannonRingColors C;
		if (T == EBannonRingTheme::Cold) { C.Floor=FColor(0x22,0x33,0x44); C.Accent=FColor(0x00,0xbb,0xff); C.MatBase=FColor(0x1e,0x28,0x30); }
		else if (T == EBannonRingTheme::Void) { C.Floor=FColor(0x11,0x11,0x22); C.Accent=FColor(0x99,0x66,0xff); C.MatBase=FColor(0x0c,0x0a,0x18); }
		return C;
	}
};

UCLASS()
class BANNONCORE_API ABannonArena : public AActor
{
	GENERATED_BODY()

public:
	ABannonArena();

	UPROPERTY(VisibleAnywhere, Category="Bannon|Arena") UStaticMeshComponent* Deck = nullptr;   // elevated ring platform
	UPROPERTY(VisibleAnywhere, Category="Bannon|Arena") UStaticMeshComponent* Mat  = nullptr;   // canvas w/ the BANNON center logo
	UPROPERTY(VisibleAnywhere, Category="Bannon|Arena") TArray<UStaticMeshComponent*> Posts;     // 4 chrome corner posts
	UPROPERTY(VisibleAnywhere, Category="Bannon|Arena") TArray<UStaticMeshComponent*> Pads;       // 12 accent turnbuckle pads
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Arena") EBannonRingTheme Theme = EBannonRingTheme::Fire;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Arena") FBannonRingColors Colors;

	// the mat albedo (BANNON center logo baked in) — matches the web buildRingMatTexture output.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Arena") FString MatTexturePath = TEXT("assets/ring/bannon_mat_fire.png");
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Arena") FString MatLogoPath    = TEXT("assets/ring/bannon_mat_logo.png");

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Arena") float RingHalfExtent = 350.f;  // cm, ~7m ring
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Bannon|Arena") int32 RopeSegments = 24;

	// (re)apply the theme's exact colors onto the deck/mat/post/pad materials (dynamic material
	// instances). Call after building or when the theme changes so the ring matches the web palette.
	UFUNCTION(BlueprintCallable, Category="Bannon|Arena")
	void ApplyThemeColors();

	// a body driven into a ring post at speed -> velocity-scaled impact damage (native env-contact law).
	// Returns damage; 0 if the hit was too soft. Post index 0..3.
	UFUNCTION(BlueprintCallable, Category="Bannon|Arena")
	float PostImpact(int32 PostIndex, FVector BodyVel, FVector BodyPos) const;

	// TLC table under a falling body: shatter past 350N -> big poise shock + localized spine damage.
	UFUNCTION(BlueprintCallable, Category="Bannon|Arena")
	bool TableImpact(float VictimMassKg, float DownVelY, float& OutPoiseShock, float& OutSpineDamage) const;
};
