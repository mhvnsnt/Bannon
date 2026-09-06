#include "BannonMDickieMapping.h"

void UBannonMDickieMapping::InitializeMDickieCrosswalk(TArray<FMDickieCrosswalk>& MappingTable)
{
    MappingTable.Empty();

    // The Degenerates (D-Generation Sex / DX Parody)
    MappingTable.Add({"Hall Nighter", "Mike Bail", "/Game/MDickie/Models/MikeBail.b3d"});
    MappingTable.Add({"Triple X", "Vanderbilt", "/Game/MDickie/Models/Vanderbilt.b3d"});
    MappingTable.Add({"The Dogg", "Drooner", "/Game/MDickie/Models/Drooner.b3d"});
    MappingTable.Add({"Ass-Man Billy", "Gunner", "/Game/MDickie/Models/Gunner.b3d"});
    MappingTable.Add({"X-Kid", "X-Terminator", "/Game/MDickie/Models/XTerminator.b3d"});
    MappingTable.Add({"Melissa Kennedy", "Stephanie", "/Game/MDickie/Models/Stephanie.b3d"});

    // The Coven of Gnarly (The Brood / Hardy Boyz / E&C Parody)
    MappingTable.Add({"Grave", "Goth", "/Game/MDickie/Models/Goth.b3d"});
    MappingTable.Add({"Jett Gnarly", "Jester", "/Game/MDickie/Models/Jester.b3d"});
    MappingTable.Add({"Mokk Gnarly", "Matador", "/Game/MDickie/Models/Matador.b3d"});
    MappingTable.Add({"Razor", "Sharp", "/Game/MDickie/Models/Sharp.b3d"});
    MappingTable.Add({"Crux", "Cross", "/Game/MDickie/Models/Cross.b3d"});
    MappingTable.Add({"Luna", "Lola", "/Game/MDickie/Models/Lola.b3d"});

    // NWC (New World Covenant / nWo Parody)
    MappingTable.Add({"The Vandal", "Thunder Muscle", "/Game/MDickie/Models/ThunderMuscle.b3d"});
    MappingTable.Add({"Vato", "Bloke", "/Game/MDickie/Models/Bloke.b3d"});
    MappingTable.Add({"Big Cash", "Driver", "/Game/MDickie/Models/Driver.b3d"});
    MappingTable.Add({"Aaron Reiner", "Mutant", "/Game/MDickie/Models/Mutant.b3d"});
    MappingTable.Add({"Toxin", "Stardust", "/Game/MDickie/Models/Stardust.b3d"});
    MappingTable.Add({"Judas Messiah", "Jimi Sierra", "/Game/MDickie/Models/JimiSierra.b3d"});

    // The Alliance / Core
    MappingTable.Add({"Marquis Whitacre", "Solaris", "/Game/MDickie/Models/Solaris.b3d"});
    MappingTable.Add({"Tyneshia Hall", "Karma", "/Game/MDickie/Models/Karma.b3d"});
    MappingTable.Add({"Andre Curtis", "Stick-Up", "/Game/MDickie/Models/StickUp.b3d"});
    MappingTable.Add({"Narvin Jackson", "Finxsse", "/Game/MDickie/Models/Finxsse.b3d"});
    MappingTable.Add({"Jaleel Friday", "Trap Shinobi", "/Game/MDickie/Models/TrapShinobi.b3d"});
    MappingTable.Add({"Fred Rico Hunter", "Jager", "/Game/MDickie/Models/Jager.b3d"});
    MappingTable.Add({"Chief Red Cloud", "Red Cloud", "/Game/MDickie/Models/RedCloud.b3d"});
    MappingTable.Add({"The Lion of Punjab", "Punjab Lion", "/Game/MDickie/Models/PunjabLion.b3d"});
    MappingTable.Add({"Lady Rhiannon", "Rhiannon", "/Game/MDickie/Models/Rhiannon.b3d"});
    MappingTable.Add({"Agent Canuck", "Canuck", "/Game/MDickie/Models/Canuck.b3d"});
    MappingTable.Add({"The Celtic Fury", "Celtic Fury", "/Game/MDickie/Models/CelticFury.b3d"});

    // The Administration / Corporate Elite
    MappingTable.Add({"Edwin John Kennedy", "The Boss", "/Game/MDickie/Models/TheBoss.b3d"});
    MappingTable.Add({"Sam Combs", "Honey Combs", "/Game/MDickie/Models/HoneyCombs.b3d"});
    MappingTable.Add({"Cody Callahan", "Cody Callahan", "/Game/MDickie/Models/CodyCallahan.b3d"});
    MappingTable.Add({"Sam Kennedy", "Sammy Kennedy", "/Game/MDickie/Models/SammyKennedy.b3d"});

    // Other Key Main Eventers & Book 4-6 Expansions
    MappingTable.Add({"John Ford", "Block Buster", "/Game/MDickie/Models/BlockBuster.b3d"});
    MappingTable.Add({"Cain Elias", "Midwinter", "/Game/MDickie/Models/Midwinter.b3d"});
    MappingTable.Add({"Vain Abel", "Siberia", "/Game/MDickie/Models/Siberia.b3d"});
    MappingTable.Add({"The Saint", "Slam Dunk", "/Game/MDickie/Models/SlamDunk.b3d"});
    MappingTable.Add({"Drake Vane", "Rattlesnake", "/Game/MDickie/Models/Rattlesnake.b3d"});
    MappingTable.Add({"Hawk", "Jansen", "/Game/MDickie/Models/Jansen.b3d"});
    MappingTable.Add({"Maroon", "Ackerman", "/Game/MDickie/Models/Ackerman.b3d"});

    // Hollywood & Music World
    MappingTable.Add({"Pretty Flacko", "Slick Rick", "/Game/MDickie/Models/SlickRick.b3d"});
    MappingTable.Add({"Club God", "BeatKing", "/Game/MDickie/Models/BeatKing.b3d"});
    MappingTable.Add({"The Bad Gal", "Rondalyn", "/Game/MDickie/Models/Rondalyn.b3d"});
    MappingTable.Add({"Slime", "Snotty", "/Game/MDickie/Models/Snotty.b3d"});
    MappingTable.Add({"Prince", "Princess", "/Game/MDickie/Models/Princess.b3d"});

    // Jobbers, Island Warlords & Underground
    MappingTable.Add({"Iron Tusk", "Iron Tusk", "/Game/MDickie/Models/IronTusk.b3d"});
    MappingTable.Add({"Spike", "Bully", "/Game/MDickie/Models/Bully.b3d"});
    MappingTable.Add({"Hammer", "D-Min", "/Game/MDickie/Models/DMin.b3d"});
    MappingTable.Add({"Dice", "Dice", "/Game/MDickie/Models/Dice.b3d"});
    MappingTable.Add({"Chip", "Chip", "/Game/MDickie/Models/Chip.b3d"});
    MappingTable.Add({"Slick Willy", "Slick", "/Game/MDickie/Models/Slick.b3d"});

    // The Cult's Hollow Points
    MappingTable.Add({"Air Jordan", "Jordan", "/Game/MDickie/Models/Jordan.b3d"});
    MappingTable.Add({"Tank", "Tank", "/Game/MDickie/Models/Tank.b3d"});
    MappingTable.Add({"Kid Glide", "Glide", "/Game/MDickie/Models/Glide.b3d"});

    // The Masterpiece Corrupted Art Variants (The Gallery)
    MappingTable.Add({"The Repetition", "Warhol", "/Game/MDickie/Models/Warhol.b3d"});
    MappingTable.Add({"The Thinker", "Rodin", "/Game/MDickie/Models/Rodin.b3d"});
    MappingTable.Add({"The Velocity", "Futurista", "/Game/MDickie/Models/Futurista.b3d"});
    MappingTable.Add({"The Cubist", "Picasso", "/Game/MDickie/Models/Picasso.b3d"});

    // Temple Lucha Stars
    MappingTable.Add({"The Matador", "El Matador", "/Game/MDickie/Models/ElMatador.b3d"});
    MappingTable.Add({"The Phoenix", "Phoenix", "/Game/MDickie/Models/Phoenix.b3d"});
    MappingTable.Add({"Luchador Twin A", "Twin Mascaras A", "/Game/MDickie/Models/TwinMascarasA.b3d"});
    MappingTable.Add({"Luchador Twin B", "Twin Mascaras B", "/Game/MDickie/Models/TwinMascarasB.b3d"});

    // Hardcore Veterans, Mainland & Corporate Auditors
    MappingTable.Add({"Hardcore Harry", "Harry Bush", "/Game/MDickie/Models/HarryBush.b3d"});
    MappingTable.Add({"General Vance", "General G-Force", "/Game/MDickie/Models/GeneralGForce.b3d"});
    MappingTable.Add({"Auditor 1", "Mr. Audit", "/Game/MDickie/Models/MrAudit.b3d"});
    MappingTable.Add({"Auditor 2", "Tax Man", "/Game/MDickie/Models/TaxMan.b3d"});
    MappingTable.Add({"Ronald Slump", "Ronald Slump", "/Game/MDickie/Models/RonaldSlump.b3d"});
    MappingTable.Add({"Donald Slump Jr.", "Donald Slump Jr", "/Game/MDickie/Models/DonaldSlumpJr.b3d"});
}
