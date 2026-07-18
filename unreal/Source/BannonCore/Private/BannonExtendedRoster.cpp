#include "BannonExtendedRoster.h"

void UBannonExtendedRoster::LoadExtendedCharacters(TArray<FBookCharacterProfile>& OutRoster)
{
    // Appending the remaining missing characters from Books 4, 5, and 6 to the manifest

    // The Underground / Island Jobbers & Warlords
    OutRoster.Add({"", "Iron Tusk", "Legion of Doom / Road Warrior Archetype", "The Underground", 0, 0, 0});
    OutRoster.Add({"", "Spike", "Biker Brawler", "The Bash Brothers", 0, 0, 0});
    OutRoster.Add({"", "Hammer", "Biker Powerhouse", "The Bash Brothers", 0, 0, 0});
    OutRoster.Add({"", "Dice", "Gambler High Flyer", "The High Rollers", 0, 0, 0});
    OutRoster.Add({"", "Chip", "Gambler Technician", "The High Rollers", 0, 0, 0});
    OutRoster.Add({"", "Slick Willy", "Jobber / Fall Guy", "Unaligned", 0, 0, 0});
    
    // The Cult's Hollow Points
    OutRoster.Add({"", "Air Jordan", "High Flyer / Shackle III", "The Cult", 0, 0, 0});
    OutRoster.Add({"", "Tank", "Brawler / Shackle IV", "The Cult", 0, 0, 0});
    OutRoster.Add({"", "Kid Glide", "Sacrificial Jobber", "The Cult", 0, 0, 0});
    
    // The Masterpiece Corrupted Art Variants
    OutRoster.Add({"", "The Repetition", "Pop Art Drone / Andy Warhol", "The Gallery", 0, 0, 0});
    OutRoster.Add({"", "The Thinker", "Brutalist Statue / Rodin", "The Gallery", 0, 0, 0});
    OutRoster.Add({"", "The Velocity", "Futurist Manifesto", "The Gallery", 0, 0, 0});
    OutRoster.Add({"", "The Cubist", "Sewn-together Abomination", "The Gallery", 0, 0, 0});

    // Mainland Government & Hollywood Expansions (Book 6 Pre-Loads)
    OutRoster.Add({"General Vance", "General Vance", "Military Commander", "Mainland", 0, 0, 0});
    OutRoster.Add({"", "Club God", "BeatKing Archetype / Miami Gatekeeper", "The Dirty South", 0, 0, 0});
    OutRoster.Add({"", "Pretty Flacko", "ASAP Rocky Archetype / Fashion Flyer", "Hollywood", 0, 0, 0});
    OutRoster.Add({"", "The Bad Gal", "Rihanna Archetype / Boss Manager", "Hollywood", 0, 0, 0});
    OutRoster.Add({"", "Slime", "Young Thug Archetype / Chaotic Flyer", "Hollywood", 0, 0, 0});
    OutRoster.Add({"", "Prince", "Lil Keed Archetype / Chaotic Flyer", "Hollywood", 0, 0, 0});
    
    // The Temple Faction (Lucha Underground Expansion)
    OutRoster.Add({"", "The Matador", "Pentagon Jr Archetype / Cero Miedo", "Lucha", 0, 0, 0});
    OutRoster.Add({"", "The Phoenix", "Rey Fenix Archetype / Aerialist", "Lucha", 0, 0, 0});
    OutRoster.Add({"", "Luchador Twin A", "Lucha Tag Specialist A", "Lucha", 0, 0, 0});
    OutRoster.Add({"", "Luchador Twin B", "Lucha Tag Specialist B", "Lucha", 0, 0, 0});

    // Hardcore Veterans & Unaligned
    OutRoster.Add({"", "Hardcore Harry", "Extreme Rules Veteran", "Unaligned", 0, 0, 0});

    // Corporate Enforcers / Auditors
    OutRoster.Add({"", "Auditor 1", "IRS Auditor / Debt Collector", "The Administration", 0, 0, 0});
    OutRoster.Add({"", "Auditor 2", "IRS Auditor / Forensic Accountant", "The Administration", 0, 0, 0});
    OutRoster.Add({"Ronald Slump", "Ronald Slump", "Billionaire President / Corporate Mastermind", "The Administration", 9, 9, 9});
    OutRoster.Add({"Donald Slump Jr.", "Donald Slump Jr.", "Sons of Legacy / Corporate Heirs", "The Administration", 8, 8, 8});
}
