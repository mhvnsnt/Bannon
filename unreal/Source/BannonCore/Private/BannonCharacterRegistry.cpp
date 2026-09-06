#include "BannonCharacterRegistry.h"

void UBannonCharacterRegistry::InitializeCoreRoster(TMap<FString, FBannonCharacterBio>& RosterDatabase)
{
    // Mapping the imported FBX/GLB models to their canonical narrative counterparts found in the books.
    
    // Chris Jericho Archetype - The Savior / Inner Circle
    RosterDatabase.Add("JudasMessiah", {"Judas Messiah", "Y2J / The Savior", "/Game/Models/Characters/Judas_Y2J.glb"});
    
    // CM Punk Archetype - Voice of the Voiceless / Straight Edge Leader
    RosterDatabase.Add("TheSaint", {"The Saint", "CM Punk / The Cult Leader", "/Game/Models/Characters/Saint_Punk.glb"});
    
    // Kane Archetype - The Brother of Cain Elias / The Demon
    RosterDatabase.Add("VainAbel", {"Vain Abel", "Kane / The Demon Brother", "/Game/Models/Characters/Abel_Demon.glb"});
}
