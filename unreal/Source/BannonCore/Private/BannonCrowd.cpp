// Copyright BANNON.
#include "BannonCrowd.h"

THIRD_PARTY_INCLUDES_START
#include "bannon_universe.h"
THIRD_PARTY_INCLUDES_END

UBannonCrowd::UBannonCrowd()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UBannonCrowd::BeginPlay()
{
	Super::BeginPlay();
	EnsureSections();
}

void UBannonCrowd::EnsureSections()
{
	SectionCount = FMath::Max(1, SectionCount);
	if (SectionHeat.Num() != SectionCount)
	{
		SectionHeat.Init(IdleExcitement, SectionCount);
	}
}

int32 UBannonCrowd::SectionForPosition(FVector WorldPos) const
{
	if (SectionCount <= 0)
	{
		return 0;
	}
	const FVector Local = WorldPos - (GetOwner() ? GetOwner()->GetActorLocation() : FVector::ZeroVector);
	// atan2 gives -PI..PI; fold to 0..1 around the bowl, then bucket
	float T = FMath::Atan2(Local.Y, Local.X) / (2.f * PI);
	if (T < 0.f)
	{
		T += 1.f;
	}
	return FMath::Clamp(static_cast<int32>(T * SectionCount), 0, SectionCount - 1);
}

float UBannonCrowd::GetSectionHeat(int32 Index) const
{
	return SectionHeat.IsValidIndex(Index) ? SectionHeat[Index] : Excitement;
}

static bannon::CrowdEvent ToNativeEvent(EBannonCrowdEvent Event)
{
	switch (Event)
	{
		case EBannonCrowdEvent::WeaponImpact: return bannon::CE_WEAPON_IMPACT;
		case EBannonCrowdEvent::HighArcThrow: return bannon::CE_HIGH_ARC_THROW;
		case EBannonCrowdEvent::BotchOrStall: return bannon::CE_BOTCH_OR_STALL;
		case EBannonCrowdEvent::DynamicPin:   return bannon::CE_DYNAMIC_PIN;
		default:                              return bannon::CE_NONE;
	}
}

void UBannonCrowd::ApplyPop(int32 Pop, const FVector* At)
{
	EnsureSections();
	const float Mag = Pop * 0.06f;

	// A pop is not a boo. A big move raises the whole room's investment; heat for a botch or a stall
	// drops excitement fast but only nicks investment — a crowd that watched something good does not
	// stop caring because of one blown spot.
	Excitement = FMath::Clamp(Excitement + Mag, 0.f, 1.f);
	Investment = FMath::Clamp(Investment + (Pop > 0 ? Pop * 0.012f : Pop * 0.004f), 0.f, 1.f);
	if (Pop > 0)
	{
		QuietTime = 0.f;
	}

	if (!At)
	{
		for (float& H : SectionHeat)
		{
			H = FMath::Clamp(H + Mag, 0.f, 1.f);
		}
		return;
	}

	// spatial: the near section takes it full, the rest fall off with real distance. This is why the
	// bowl is stored per section — a spot at ringside on one side should not light the far stand.
	const FVector Origin = GetOwner() ? GetOwner()->GetActorLocation() : FVector::ZeroVector;
	const float Radius = FMath::Max(1.f, PopFalloff);
	for (int32 i = 0; i < SectionHeat.Num(); ++i)
	{
		const float Ang = (2.f * PI) * ((i + 0.5f) / SectionCount);
		const FVector SectionPos = Origin + FVector(FMath::Cos(Ang), FMath::Sin(Ang), 0.f) * Radius;
		const float D = FVector::Dist2D(SectionPos, *At);
		const float Falloff = FMath::Clamp(1.f - (D / (Radius * 2.f)), 0.15f, 1.f);
		SectionHeat[i] = FMath::Clamp(SectionHeat[i] + Mag * Falloff, 0.f, 1.f);
	}
}

int32 UBannonCrowd::React(EBannonCrowdEvent Event, float ImpactVel)
{
	const int32 Pop = bannon::crowdReaction(ToNativeEvent(Event), ImpactVel);
	ApplyPop(Pop, nullptr);
	return Pop;
}

int32 UBannonCrowd::ReactAt(EBannonCrowdEvent Event, float ImpactVel, FVector WorldPos)
{
	const int32 Pop = bannon::crowdReaction(ToNativeEvent(Event), ImpactVel);
	ApplyPop(Pop, &WorldPos);
	return Pop;
}

void UBannonCrowd::FeedAction(float Dt, float FrameImpactEnergy)
{
	if (Dt <= 0.f)
	{
		return;
	}
	// Sustained work builds a crowd even with no single highlight — a long, competitive exchange is
	// exactly the thing that gets an arena on its feet, and it never fires a crowdReaction event.
	if (FrameImpactEnergy > 0.05f)
	{
		QuietTime = 0.f;
		Investment = FMath::Clamp(Investment + FMath::Min(FrameImpactEnergy, 3.f) * 0.03f * Dt, 0.f, 1.f);
	}
	else
	{
		QuietTime += Dt;
		if (QuietTime > 6.f)   // a rest hold is fine; a rest hold that will not end is not
		{
			Investment = FMath::Clamp(Investment - InvestmentDecay * Dt, 0.f, 1.f);
		}
	}
}

void UBannonCrowd::TickComponent(float Dt, ELevelTick TickType, FActorComponentTickFunction* Fn)
{
	Super::TickComponent(Dt, TickType, Fn);
	EnsureSections();

	// excitement settles fast toward the bed the investment supports — an invested crowd never drops
	// back to a dead hum, an uninterested one does.
	const float Bed = FMath::Max(IdleExcitement, Investment * 0.45f);
	Excitement = FMath::FInterpTo(Excitement, Bed, Dt, ExcitementDecay);
	for (float& H : SectionHeat)
	{
		H = FMath::FInterpTo(H, Bed, Dt, ExcitementDecay);
	}
}

void UBannonCrowd::ResetForMatch()
{
	Excitement = IdleExcitement;
	Investment = 0.25f;
	QuietTime = 0.f;
	SectionHeat.Empty();
	EnsureSections();
}
