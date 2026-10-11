#include "BannonMDickieMoves.h"

UBannonMDickieMoves::UBannonMDickieMoves()
{
}

TArray<FMDickieMoveMapping> UBannonMDickieMoves::GetLegacyMoveCatalog()
{
    TArray<FMDickieMoveMapping> Catalog;

    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Collar-and-Elbow");
        Move.MDickieLegacyName = TEXT("grappling");
        Move.ActionType = TEXT("lockup");
        Move.Category = EMDickieMoveCategory::Position;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Irish Whip");
        Move.MDickieLegacyName = TEXT("irish whip");
        Move.ActionType = TEXT("whip");
        Move.Category = EMDickieMoveCategory::Position;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Toss From Ring");
        Move.MDickieLegacyName = TEXT("force out of ring");
        Move.ActionType = TEXT("force_out");
        Move.Category = EMDickieMoveCategory::Position;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Roll Into Ring");
        Move.MDickieLegacyName = TEXT("force into ring");
        Move.ActionType = TEXT("force_in");
        Move.Category = EMDickieMoveCategory::Position;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Apron Drag-Out");
        Move.MDickieLegacyName = TEXT("drag out from apron");
        Move.ActionType = TEXT("drag_out");
        Move.Category = EMDickieMoveCategory::Position;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Apron Drag-In");
        Move.MDickieLegacyName = TEXT("drag in from apron");
        Move.ActionType = TEXT("drag_in");
        Move.Category = EMDickieMoveCategory::Position;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Platform Drag-Down");
        Move.MDickieLegacyName = TEXT("drag down from platform");
        Move.ActionType = TEXT("drag_down");
        Move.Category = EMDickieMoveCategory::Position;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Body Toll");
        Move.MDickieLegacyName = TEXT("bodyslam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Vertical Verdict");
        Move.MDickieLegacyName = TEXT("suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Snap Verdict");
        Move.MDickieLegacyName = TEXT("snap suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Suspended Verdict");
        Move.MDickieLegacyName = TEXT("stalling suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Cranium Driver");
        Move.MDickieLegacyName = TEXT("brainbuster");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Suspended Cranium");
        Move.MDickieLegacyName = TEXT("stalling brainbuster");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Piston Slam");
        Move.MDickieLegacyName = TEXT("jackhammer");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Dropping Verdict");
        Move.MDickieLegacyName = TEXT("suplex drop");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Silent Sleeper");
        Move.MDickieLegacyName = TEXT("sleeper hold");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Vice Headlock");
        Move.MDickieLegacyName = TEXT("headlock");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Headlock Hammer");
        Move.MDickieLegacyName = TEXT("headlock punch");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Strike;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Running Bulldog");
        Move.MDickieLegacyName = TEXT("bulldog");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Headlock Takedown");
        Move.MDickieLegacyName = TEXT("headlock takedown");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Piston Press");
        Move.MDickieLegacyName = TEXT("pumping press slam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Overhead Verdict");
        Move.MDickieLegacyName = TEXT("press slam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Indefinite Suspension");
        Move.MDickieLegacyName = TEXT("gorilla press slam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Running Powerslam");
        Move.MDickieLegacyName = TEXT("powerslam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Shoulder Reckoning");
        Move.MDickieLegacyName = TEXT("shoulder powerslam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Shoulder Breaker");
        Move.MDickieLegacyName = TEXT("shoulder breaker");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("The Headstone");
        Move.MDickieLegacyName = TEXT("tombstone piledriver");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Inverted Foundation");
        Move.MDickieLegacyName = TEXT("inverted piledriver");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Leaping Body Toll");
        Move.MDickieLegacyName = TEXT("jumping bodyslam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Foundation Driver");
        Move.MDickieLegacyName = TEXT("piledriver");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Broken Architect Bomb");
        Move.MDickieLegacyName = TEXT("powerbomb");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Seated Collapse");
        Move.MDickieLegacyName = TEXT("sitting powerbomb");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("The Pedigree Clause");
        Move.MDickieLegacyName = TEXT("underhook facebuster (pedigree)");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Comet Rana");
        Move.MDickieLegacyName = TEXT("hurricanranna");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Leaping Comet");
        Move.MDickieLegacyName = TEXT("leaping plancha");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Orbital Scissors");
        Move.MDickieLegacyName = TEXT("flying head scissors");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Small Package");
        Move.MDickieLegacyName = TEXT("small package");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Overhand Collapse");
        Move.MDickieLegacyName = TEXT("belly-to-belly suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Overhand Slam");
        Move.MDickieLegacyName = TEXT("belly-to-belly slam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Aurora Bridge");
        Move.MDickieLegacyName = TEXT("northern lights suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Skyward Toss");
        Move.MDickieLegacyName = TEXT("back body drop");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Deadlift Spinebuster");
        Move.MDickieLegacyName = TEXT("spinebuster");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Lateral Collapse");
        Move.MDickieLegacyName = TEXT("side slam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Lateral Breaker");
        Move.MDickieLegacyName = TEXT("side backbreaker");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Inverted Atomic");
        Move.MDickieLegacyName = TEXT("inverted atomic drop");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Kidney Breaker");
        Move.MDickieLegacyName = TEXT("backbreaker");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("The Reckoning Cutter");
        Move.MDickieLegacyName = TEXT("stunner");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("The Bottom Line");
        Move.MDickieLegacyName = TEXT("rock bottom");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Deadlift German");
        Move.MDickieLegacyName = TEXT("german suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Rear Skyfall");
        Move.MDickieLegacyName = TEXT("back suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Atomic Verdict");
        Move.MDickieLegacyName = TEXT("atomic drop");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Toe-Hold Takedown");
        Move.MDickieLegacyName = TEXT("drop toe hold");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Island Drop");
        Move.MDickieLegacyName = TEXT("samoan drop");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Ravine Driver");
        Move.MDickieLegacyName = TEXT("death valley driver");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Snap Takedown");
        Move.MDickieLegacyName = TEXT("snapmare");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Neck Verdict");
        Move.MDickieLegacyName = TEXT("neckbreaker");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Hip Verdict");
        Move.MDickieLegacyName = TEXT("hip toss");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Gutwrench Verdict");
        Move.MDickieLegacyName = TEXT("gutwrench suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Sickle Sweep");
        Move.MDickieLegacyName = TEXT("russian legsweep");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Scorpio Spear");
        Move.MDickieLegacyName = TEXT("spear");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Strike;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Scorpio Lariat");
        Move.MDickieLegacyName = TEXT("standing clothesline");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Strike;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Gooseneck Hoist");
        Move.MDickieLegacyName = TEXT("choke slam");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("The X-Verdict");
        Move.MDickieLegacyName = TEXT("x-factor");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Underhook Verdict");
        Move.MDickieLegacyName = TEXT("underhook suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Reverse Verdict");
        Move.MDickieLegacyName = TEXT("reverse suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Victory Roll");
        Move.MDickieLegacyName = TEXT("victory roll");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Test of Strength");
        Move.MDickieLegacyName = TEXT("test of strength");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Guillotine Verdict");
        Move.MDickieLegacyName = TEXT("razor's edge");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Lights Out Knee");
        Move.MDickieLegacyName = TEXT("go to sleep");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Schoolboy Roll-Up");
        Move.MDickieLegacyName = TEXT("roll-up pin");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Crucifix Cradle");
        Move.MDickieLegacyName = TEXT("crucifix pin");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Nelson Vice");
        Move.MDickieLegacyName = TEXT("full nelson");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Dragon Collapse");
        Move.MDickieLegacyName = TEXT("full nelson suplex");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Cranial Finale");
        Move.MDickieLegacyName = TEXT("skull crushing finale");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    {
        FMDickieMoveMapping Move;
        Move.BannonName = TEXT("Gooseneck Toss");
        Move.MDickieLegacyName = TEXT("throat toss");
        Move.ActionType = TEXT("");
        Move.Category = EMDickieMoveCategory::Unknown;
        Catalog.Add(Move);
    }
    return Catalog;
}

bool UBannonMDickieMoves::ValidateMoveExistence(FString MoveName)
{
    TArray<FMDickieMoveMapping> Catalog = GetLegacyMoveCatalog();
    for (const FMDickieMoveMapping& Move : Catalog)
    {
        if (Move.BannonName == MoveName || Move.MDickieLegacyName == MoveName)
        {
            return true;
        }
    }
    return false;
}
