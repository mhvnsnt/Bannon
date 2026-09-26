#include "BannonFullRosterManifest.h"

void UBannonFullRosterManifest::LoadBookCharacters(TArray<FBookCharacterProfile>& OutRoster)
{
    OutRoster.Empty();

    // The Alliance / Core
    OutRoster.Add({"Marquis Whitacre", "Bannon / Maime / Solaris Justice", "The Broken Architect", "The Alliance", 3, 5, 2});
    OutRoster.Add({"Tyneshia Hall", "Karma", "The Anchor / Structural Builder", "The Alliance", 4, 7, 0});
    OutRoster.Add({"Andre Curtis", "Stick-Up / The Martyr", "Reckless Showman / Reverend", "The Alliance", 1, 4, 0});
    OutRoster.Add({"Narvin Jackson", "Finxsse", "The Street Avenger", "The Alliance", 0, 0, 0}); // Sun Cancer, Mars Leo
    OutRoster.Add({"Jaleel Friday", "Trap Shinobi", "The Glitch / Smart Mark Ninja", "The Alliance", 0, 0, 0});
    OutRoster.Add({"Fred Rico Hunter", "Jager", "The Emo Rockstar / The Bard", "The Alliance", 0, 0, 0});
    OutRoster.Add({"", "Chief Red Cloud", "Moral Core", "The Alliance", 9, 6, 0});
    OutRoster.Add({"", "The Lion of Punjab", "Trusted Loyalist", "The Alliance", 6, 5, 0});
    OutRoster.Add({"", "Lady Rhiannon", "Global Diplomat", "The Alliance", 2, 6, 0});
    OutRoster.Add({"", "Agent Canuck", "Communicative Rebel", "The Alliance", 3, 9, 0});
    OutRoster.Add({"", "The Celtic Fury", "Wildcard", "The Alliance", 5, 9, 0});

    // The Administration / Corporate Elite
    OutRoster.Add({"Edwin John Kennedy", "The Boss", "Master Tyrant / Genetic Jackhammer", "The Administration", 33, 0, 0});
    OutRoster.Add({"Stan Combs", "Honey", "Shadow Architect / Global Overlord", "The Administration", 8, 0, 0});
    OutRoster.Add({"Cody Callahan", "Corduroy Kid", "Toxic Manager / Glitch Econ", "The Administration", 6, 5, 0});
    OutRoster.Add({"Ronald Slump", "President Slump", "Billionaire President", "The Administration", 0, 0, 0});
    OutRoster.Add({"Donald Slump Jr.", "Slump Jr.", "The Wild Card", "The Administration", 0, 0, 0});
    OutRoster.Add({"Sam Kennedy", "The Stuntman", "Shane Archetype", "The Administration", 0, 0, 0});
    OutRoster.Add({"Melissa Kennedy", "The Heiress", "Chyna / Stephanie Archetype", "The Administration", 0, 0, 0});
    OutRoster.Add({"Lars Van Horn", "Triple X", "Cerebral Assassin / HHH Archetype", "The Administration", 0, 0, 0});
    OutRoster.Add({"", "Hall Nighter", "The Showstopper / HBK Archetype", "The Administration", 0, 0, 0});
    OutRoster.Add({"", "The Dogg", "Road Dogg Archetype", "The Administration", 0, 0, 0});
    OutRoster.Add({"", "Ass-Man Billy", "Billy Gunn Archetype", "The Administration", 0, 0, 0});
    OutRoster.Add({"", "X-Kid", "X-Pac Archetype", "The Administration", 0, 0, 0});

    // The Dynasty
    OutRoster.Add({"", "Kray-Z", "The Mogul / Jay-Z Archetype", "The Dynasty", 22, 0, 0});
    OutRoster.Add({"", "Ronye", "The Visionary / Kanye Archetype", "The Dynasty", 11, 0, 0});
    OutRoster.Add({"", "Krusha P", "The Dealer / Pusha T Archetype", "The Dynasty", 6, 0, 0});
    OutRoster.Add({"", "Mars", "The War", "The Dynasty", 0, 0, 0});
    OutRoster.Add({"", "Saturn", "The Timekeeper", "The Dynasty", 0, 0, 0});

    // New World Covenant (NWC)
    OutRoster.Add({"", "The Vandal", "NWC Leader / Hollywood", "NWC", 0, 0, 0});
    OutRoster.Add({"", "Vato", "The Bad Guy / Razor Ramon Archetype", "NWC", 0, 0, 0});
    OutRoster.Add({"", "Big Cash", "The Giant / Kevin Nash Archetype", "NWC", 0, 0, 0});
    OutRoster.Add({"", "Aaron Reiner", "The Genetic Anomaly / Steiner Archetype", "NWC", 0, 0, 0});
    OutRoster.Add({"", "Toxin", "The Icon / Wolfpack Sting", "NWC", 0, 0, 0});
    OutRoster.Add({"", "Judas Messiah", "The Savior / Y2J Archetype", "NWC", 0, 0, 0});
    OutRoster.Add({"", "Lil Bill", "Project Baby", "NWC", 0, 0, 0});

    // JPCW
    OutRoster.Add({"Cain Elias", "The Executioner / The Phantom", "The Deadman / Undertaker", "JPCW", 6, 8, 0});
    OutRoster.Add({"Vain Abel", "The Monster", "The Demon Brother / Kane", "JPCW", 0, 0, 0});
    OutRoster.Add({"Masato Iida", "The Silent Samurai", "Honorable Enforcer", "JPCW", 6, 7, 0});
    OutRoster.Add({"Hikaru Arashi", "The Storm", "Agile Disruptor", "JPCW", 5, 2, 0});
    OutRoster.Add({"Kenji Saito", "The Masterpiece", "Technical Critic / Puppet Emperor", "JPCW", 3, 6, 0});
    OutRoster.Add({"Kiko Tanaka", "The Great Oni", "Psychological Threat / Muta", "JPCW", 7, 1, 0});
    OutRoster.Add({"Ryuji Tatsu", "The Dragon", "Physical Wall", "JPCW", 2, 8, 0});
    OutRoster.Add({"", "The Finance Demon", "Mercenary Executive", "JPCW", 8, 3, 0});
    OutRoster.Add({"", "The Shaolin Shadow", "Technical Assassin", "JPCW", 7, 4, 0});
    OutRoster.Add({"", "The Ghost of Lahore", "Shadow Assassin", "JPCW", 7, 1, 0});
    OutRoster.Add({"", "Astrid", "The Ice Maiden", "Cold Structuralist", "JPCW", 4, 8, 0});
    OutRoster.Add({"", "Machine Tiger", "Counter-Architect", "JPCW", 4, 0, 0});

    // The Masterpiece / The Gallery
    OutRoster.Add({"Pablo", "The Minotaur / The Abstract", "Avant-Garde Monster", "The Gallery", 8, 0, 0});
    OutRoster.Add({"Jean", "The Radiant Child", "Basquiat Archetype", "The Gallery", 5, 0, 0});
    OutRoster.Add({"Vincent", "The Starry Knight", "Van Gogh Archetype", "The Gallery", 5, 0, 0});
    OutRoster.Add({"Salvador", "The Surrealist", "Dali Archetype", "The Gallery", 3, 0, 0});
    OutRoster.Add({"Magdalena", "La Destructora / Kali", "Frida Kahlo Archetype", "The Gallery", 3, 0, 0});
    OutRoster.Add({"", "Vincent Jean", "The Expressionist", "The Gallery", 0, 0, 0});

    // The Straight Shooters
    OutRoster.Add({"", "The Saint", "CM Punk Archetype", "The Shooters", 0, 0, 0});
    OutRoster.Add({"", "Locomotive", "A-Train Archetype", "The Shooters", 0, 0, 0});
    OutRoster.Add({"", "The Exam", "Test Archetype", "The Shooters", 0, 0, 0});
    OutRoster.Add({"", "Big LG", "Luke Gallows Archetype", "The Shooters", 0, 0, 0});
    OutRoster.Add({"", "Gunner", "Karl Anderson Archetype", "The Shooters", 0, 0, 0});
    OutRoster.Add({"", "The Phenom", "AJ Styles Archetype", "The Shooters", 0, 0, 0});

    // The Coven of Gnarly
    OutRoster.Add({"", "Grave", "Vampire Lord / Gangrel Archetype", "The Coven", 0, 0, 0});
    OutRoster.Add({"", "Jett Gnarly", "Jeff Hardy Archetype", "The Coven", 0, 0, 0});
    OutRoster.Add({"", "Mokk Gnarly", "Matt Hardy Archetype", "The Coven", 0, 0, 0});
    OutRoster.Add({"", "Razor", "Edge Archetype", "The Coven", 0, 0, 0});
    OutRoster.Add({"", "Crux", "Christian Archetype", "The Coven", 0, 0, 0});
    OutRoster.Add({"", "Luna", "Lita Archetype", "The Coven", 0, 0, 0});

    // Lucha Libre
    OutRoster.Add({"", "Rey Fuego", "The Fire Feather", "Lucha", 3, 9, 0});
    OutRoster.Add({"", "El Toro de Oro", "The Golden Bull / Corporate Animal", "Lucha", 4, 2, 0});
    OutRoster.Add({"", "Sombra Negra", "Calculated Mercenary", "Lucha", 9, 5, 0});
    OutRoster.Add({"", "El Jefe", "Dario Cueto Archetype", "Lucha", 0, 0, 0});
    OutRoster.Add({"", "The Sacrifice", "Matanza Archetype", "Lucha", 0, 0, 0});

    // The Mainland / Hollywood
    OutRoster.Add({"John Ford", "The Marine", "John Cena Archetype", "Hollywood", 0, 0, 0});
    OutRoster.Add({"", "The Boulder", "The Rock Archetype", "Hollywood", 0, 0, 0});
    OutRoster.Add({"", "Agent Smith", "Will Smith Archetype", "Hollywood", 0, 0, 0});
    OutRoster.Add({"", "La Flame", "Travis Scott Archetype", "Hollywood", 0, 0, 0});
    OutRoster.Add({"", "Lucious", "Theorist / Terrence Howard", "Hollywood", 0, 0, 0});
    OutRoster.Add({"", "Tiffany Star", "Reality Star Diva", "Hollywood", 0, 0, 0});
    OutRoster.Add({"Devon Trust", "Tech Lord", "Elon Musk Archetype", "Hollywood", 0, 0, 0});

    // Others
    OutRoster.Add({"Marchell Friday", "Chainlink", "The Knight of the Covenant", "Unaligned", 8, 0, 0});
    OutRoster.Add({"", "Mr. Zero Point", "The Nihilist", "Unaligned", 9, 7, 0});
    OutRoster.Add({"", "Gorgon", "Big Daddy V Archetype", "Unaligned", 0, 0, 0});
    OutRoster.Add({"", "Jack Slade", "The Warden / Cactus Jack Archetype", "Unaligned", 0, 0, 0});
    OutRoster.Add({"", "Drake Vane", "The Legend Killer / Randy Orton Archetype", "Revolution", 0, 0, 0});
    OutRoster.Add({"", "The Algorithm", "Logan Paul Archetype", "Mainland", 0, 0, 0});
}
