// Godmode TTS Mapping System
// Links the canonical Bannon universe character list to stylized, parody-likeness voice IDs 
// for the dialogue and entrance systems, and handles God Within Reality Check distortion.

import fs from 'fs';
import path from 'path';

// Mapping of in-game character identities to their stylized voice archetypes
export const VoiceMap = {
    // ---- CORE CHARACTERS ----
    "Bannon": {
        voiceId: "bannon_main", cloneFrom: "original", style: "commanding",
        description: "Marquis Whitacre's alter ego. Deep, commanding, grizzled veteran."
    },
    "Cain Elias": {
        voiceId: "cain_elias", cloneFrom: "undertaker_hoss_delgado", style: "demonic_brawler",
        description: "Undertaker / Hoss Delgado / Brick Samson archetype. Imposing, deep."
    },
    "Queen Tyneshia": {
        voiceId: "queen_tyneshia", cloneFrom: "original", style: "intense_royal",
        description: "Intense, philosophical, authoritative."
    },
    "Solaris Justice": {
        voiceId: "solaris_justice", cloneFrom: "original", style: "heroic_focused",
        description: "Marquis Whitacre's first persona. Pure, focused, energetic."
    },
    "Atlas Vance": {
        voiceId: "atlas_vance", cloneFrom: "original", style: "corporate_authoritative",
        description: "Authoritative boss energy, disciplined."
    },
    "Stick-Up": {
        voiceId: "stick_up", cloneFrom: "original", style: "street_enforcer",
        description: "Andre Curtis. Street enforcer, short sentences."
    },
    "Finxsse": {
        voiceId: "finxsse", cloneFrom: "original", style: "slick_hustler",
        description: "Narvin Jackson. Smooth talker, hustler energy."
    },
    "Red Cloud": {
        voiceId: "red_cloud", cloneFrom: "tatanka", style: "proud_warrior",
        description: "Tatanka archetype. Proud, traditional cadence."
    },
    "Cassian Thorne": {
        voiceId: "cassian_thorne", cloneFrom: "original", style: "dark_intensity",
        description: "Dark, intense, calculating."
    },
    "Sombra Negra": {
        voiceId: "sombra_negra", cloneFrom: "la_parka_bushi_sin_cara", style: "cryptic_masked",
        description: "Masked luchador mystery archetype, cryptic, speaks rarely and in riddles."
    },
    "Maime": {
        voiceId: "maime", cloneFrom: "original", style: "manic_feral",
        description: "Unhinged manic Marquis Whitacre, paranoid and feral, betrayed."
    },
    "Karma": {
        voiceId: "karma", cloneFrom: "original", style: "vengeful",
        description: "Tyneshia Hall's first wrestling persona. Vengeful, sharp."
    },
    "Viper": {
        voiceId: "viper", cloneFrom: "tyson_mayweather", style: "fast_aggressive",
        description: "Mike Tyson mixed with Floyd Mayweather. Fast, aggressive, unpredictable."
    },
    "Kage": {
        voiceId: "kage", cloneFrom: "original", style: "shadow_ninja",
        description: "Shadowy, whisper-quiet ninja."
    },
    "Brutus": {
        voiceId: "brutus", cloneFrom: "bronson_reed", style: "heavy_bruiser",
        description: "Bronson Reed archetype. Heavy, booming bruiser."
    },
    "Zephyr": {
        voiceId: "zephyr", cloneFrom: "original", style: "rhythmic_fighter",
        description: "Brazilian capoeira fighter. Rhythmic, flowing cadence."
    },
    "Mortus": {
        voiceId: "mortus", cloneFrom: "original", style: "death_obsessed",
        description: "Death-obsessed, slow dragging voice."
    },
    "Titan": {
        voiceId: "titan", cloneFrom: "vader_big_bear", style: "roaring_monster",
        description: "Vader / Big Bear archetype. Loud roars, heavy breathing."
    },
    "Golem": {
        voiceId: "golem", cloneFrom: "original", style: "monosyllabic_giant",
        description: "Monosyllabic giant, gravelly voice."
    },
    "Ronin": {
        voiceId: "ronin", cloneFrom: "original", style: "stoic_ninja",
        description: "Japanese ninja, traditional and stoic."
    },
    
    // ---- ADDITIONS (PABLO, EL TORO DE ORO, CIPHER, ECHO, ONYX, STATIC, HOLLOW) ----
    "Pablo": {
        voiceId: "pablo", cloneFrom: "picasso_goldust_black_reign", style: "bizarre_artistic",
        description: "Pablo Picasso mixed with Goldust mixed with TNA Black Reign. Deep breathing, bizarre cadence."
    },
    "El Toro de Oro": {
        voiceId: "el_toro_de_oro", cloneFrom: "batista_corporate", style: "snob_enforcer",
        description: "Batista type but corporate snob pretty boy type enforcer."
    },
    "Cipher": {
        voiceId: "cipher", cloneFrom: "lio_rush_blackheart", style: "dark_manic_unhinged",
        description: "2026 Blackheart Lio Rush type. Dark, manic, whispering-to-screaming erratic intensity. Unhinged and brooding, corrupted by an unseen entity he calls \"he\" and \"him\". Possessed most of the time, used to be a cocky hype man. (Requires ripping 2026 indie/GCW-era promos for reference)."
    },
    "Echo": {
        voiceId: "echo", cloneFrom: "shotzi_blackheart", style: "punk_wild",
        description: "Shotzi Blackheart type. Wild, howling, punk energy. (Requires ripping 2026 WWE return promos for reference)."
    },
    "Onyx": {
        voiceId: "onyx", cloneFrom: "original", style: "dark_cryptic",
        description: "Dark mysterious cryptic original. Monotone, echoing."
    },
    "Static": {
        voiceId: "static", cloneFrom: "enzo_amore", style: "loud_mouth",
        description: "Enzo Amore type. Loud, raspy, endless catchphrases."
    },
    "Hollow": {
        voiceId: "hollow", cloneFrom: "super_dragon_ai", style: "soulless_robotic",
        description: "Super Dragon type but AI-like, soulless, robotic, cryptic."
    },

    // ---- EXTENDED ROSTER ----
    "Judas Messiah": {
        voiceId: "judas_messiah", cloneFrom: "chris_jericho", style: "arrogant_savior",
        description: "Chris Jericho archetype. Cold, theatrical precision. Long pauses, controlled volume."
    },
    "The Saint": {
        voiceId: "the_saint", cloneFrom: "cm_punk", style: "straight_edge_intense",
        description: "CM Punk archetype. Clipped, disciplined, flat affect until provoked."
    },
    "Vain Abel": {
        voiceId: "vain_abel", cloneFrom: "kane", style: "demonic_growl",
        description: "Kane archetype. Low, gravel-heavy, deliberately slow."
    },
    "The Bad Gal": {
        voiceId: "the_bad_gal", cloneFrom: "rihanna_punk", style: "punk_aggressive",
        description: "Rihanna archetype. Sharp, fast, sarcastic — talks over people."
    },
    "The Matador": {
        voiceId: "the_matador", cloneFrom: "salvador_dali", style: "eccentric_surreal",
        description: "Salvador Dali archetype. Eccentric, formal, accented cadence, treats every match like a surreal performance."
    },
    "The Phoenix": {
        voiceId: "the_phoenix", cloneFrom: "original", style: "powerful_confident",
        description: "Breathless, earnest, rises in pitch when talking about comebacks."
    },
    "Slick Willy": {
        voiceId: "slick_willy", cloneFrom: "original", style: "jive_manager",
        description: "Southern con-man charm, unbroken smile in the voice."
    },
    "Air Jordan": {
        voiceId: "air_jordan", cloneFrom: "ricochet", style: "energetic_cocky",
        description: "Ricochet archetype. Cocky, athletic swagger."
    },
    "Tank": {
        voiceId: "tank", cloneFrom: "tank_abbott", style: "gruff_fighter",
        description: "Tank Abbott archetype. Monosyllabic, heavy."
    },
    "Kid Glide": {
        voiceId: "kid_glide", cloneFrom: "rey_mysterio", style: "underdog_hero",
        description: "Rey Mysterio archetype. Young, hyper, skater-slang cadence."
    },
    "Iron Tusk": {
        voiceId: "iron_tusk", cloneFrom: "samoa_joe", style: "quiet_menace",
        description: "Samoa Joe archetype. Guttural, minimal words, menacing."
    },
    "Hardcore Harry": {
        voiceId: "hardcore_harry", cloneFrom: "hardcore_holly_terry_funk", style: "bitter_veteran",
        description: "Hardcore Holly / Terry Funk archetype. Raspy, unhinged enthusiasm for violence."
    },
    "The Destroyer": {
        voiceId: "the_destroyer", cloneFrom: "frida_kahlo", style: "intense_passionate",
        description: "Frida Kahlo archetype. Intense, passionate, unyielding defiance."
    },
    "The Velocity": {
        voiceId: "the_velocity", cloneFrom: "vincent_van_gogh", style: "frantic_fast",
        description: "Vincent van Gogh archetype. Frantic, rapid-fire, words blur together in a manic blur."
    },
    "The Cubist": {
        voiceId: "the_cubist", cloneFrom: "pablo_picasso", style: "avant_garde_snob",
        description: "Pablo Picasso archetype. Fragmented syntax, talks in disjointed clauses, art-snob."
    },
    "General Vance": {
        voiceId: "general_vance", cloneFrom: "sgt_slaughter", style: "military_drill_sergeant",
        description: "Sgt. Slaughter archetype. Barked, military cadence, clipped commands."
    },
    "Pretty Flacko": {
        voiceId: "pretty_flacko", cloneFrom: "asap_rocky", style: "harlem_smooth",
        description: "A$AP Rocky archetype. Mumble-melodic, laid-back, half-sung delivery."
    },
    "Club God": {
        voiceId: "club_god", cloneFrom: "beatking", style: "loud_party",
        description: "BeatKing archetype. Booming, promoter-showman energy, loud party rap hype intro."
    },
    "Slime": {
        voiceId: "slime", cloneFrom: "young_thug", style: "nasal_hype",
        description: "Young Thug archetype. Melodic, oily, unpredictable pitch swings."
    },
    "Prince": {
        voiceId: "prince", cloneFrom: "lil_keed", style: "smooth_closer",
        description: "Lil Keed archetype. Nasal, fast-talking hype, smoother counterpart."
    },
    "Spike": {
        voiceId: "spike", cloneFrom: "apa_dudley", style: "rapid_punchy",
        description: "Dudley Boyz / APA archetype. Rapid, punchy delivery, finishes Hammer's sentences."
    },
    "Hammer": {
        voiceId: "hammer", cloneFrom: "apa_dudley", style: "booming_slow",
        description: "Dudley Boyz / APA archetype. Booming, slow, drops one loud line."
    },
    "Dice": {
        voiceId: "dice", cloneFrom: "deuce", style: "rapid_hustler",
        description: "Deuce n Domino archetype. Cocky, rapid patter, always closing."
    },
    "Chip": {
        voiceId: "chip", cloneFrom: "domino", style: "dry_deadpan",
        description: "Deuce n Domino archetype. Dry, deadpan counter to Dice's hype."
    },
    "Luchador Relampago": {
        voiceId: "luchador_relampago", cloneFrom: "lucha_bros", style: "intense_spanish",
        description: "Lucha Bros archetype. Mirror each other's cadence exactly."
    },
    "Luchador Trueno": {
        voiceId: "luchador_trueno", cloneFrom: "lucha_bros", style: "intense_spanish",
        description: "Lucha Bros archetype. Alternate lines mid-sentence."
    },
    "Auditor Prime": {
        voiceId: "auditor_prime", cloneFrom: "rtc", style: "monotone_bureaucrat",
        description: "Right to Censor archetype. Monotone, bureaucratic, unsettling calm."
    },
    "Auditor Second": {
        voiceId: "auditor_second", cloneFrom: "rtc", style: "monotone_bureaucrat",
        description: "Right to Censor archetype. Alternate delivering bad news in flat cadence."
    },
    "Grave": {
        voiceId: "grave", cloneFrom: "gangrel", style: "droning_funeral",
        description: "Gangrel archetype. Droning, funeral-slow."
    },
    "Jett Gnarly": {
        voiceId: "jett_gnarly", cloneFrom: "jeff_hardy", style: "manic_skate_punk",
        description: "Jeff Hardy archetype. Manic skate-punk energy."
    },
    "Mokk Gnarly": {
        voiceId: "mokk_gnarly", cloneFrom: "matt_hardy", style: "manic_skate_punk",
        description: "Matt Hardy archetype. Sharp and clipped."
    },
    "Razor": {
        voiceId: "razor", cloneFrom: "edge", style: "machismo_goth",
        description: "Edge archetype. Sharp and clipped, dark-twist machismo."
    },
    "Crux": {
        voiceId: "crux", cloneFrom: "christian", style: "sharp_clipped",
        description: "Christian archetype. Sharp and clipped."
    },
    "Luna Gnarly": {
        voiceId: "luna_gnarly", cloneFrom: "lita", style: "dreamy_detached",
        description: "Lita archetype. Dreamy, detached."
    },
    "Jager": {
        voiceId: "jager", cloneFrom: "fred_rico_hinter", style: "arrogant_euro",
        description: "Fred Rico Hinter archetype. Arrogant."
    },
    "Triple X": {
        voiceId: "triple_x", cloneFrom: "triple_h", style: "brash_frat",
        description: "Triple H archetype. Brash frat-boy bravado."
    },
    "Hall Nighter": {
        voiceId: "hall_nighter", cloneFrom: "shawn_michaels", style: "raspy_chaos",
        description: "Shawn Michaels archetype. Raspy chaos."
    },
    "The Dogg": {
        voiceId: "the_dogg", cloneFrom: "road_dogg", style: "laid_back_drawl",
        description: "Road Dogg archetype. Laid-back drawl."
    },
    "Ass-Man Billy": {
        voiceId: "ass_man_billy", cloneFrom: "billy_gunn", style: "loud_dumb_jock",
        description: "Billy Gunn archetype. Loud dumb-jock energy."
    },
    "X-Kid": {
        voiceId: "x_kid", cloneFrom: "x_pac", style: "hyper_sidekick",
        description: "X-Pac archetype. Hyper young sidekick."
    },
    "The Vandal": {
        voiceId: "the_vandal", cloneFrom: "hollywood_hogan", style: "raspy_brother",
        description: "Hollywood Hogan archetype. Raspy, uses brother/dude."
    },
    "Vato": {
        voiceId: "vato", cloneFrom: "scott_hall", style: "street_smooth",
        description: "Scott Hall archetype. Street-smooth, machismo."
    },
    "Big Cash": {
        voiceId: "big_cash", cloneFrom: "kevin_nash", style: "money_obsessed",
        description: "Kevin Nash archetype. Money-obsessed swagger."
    },
    "Aaron Reiner": {
        voiceId: "aaron_reiner", cloneFrom: "scott_steiner", style: "manic_math",
        description: "Scott Steiner archetype. Manic, unhinged Steiner math."
    },
    "Toxin": {
        voiceId: "toxin", cloneFrom: "crow_sting", style: "sinister_undertone",
        description: "Crow Sting archetype. Sinister undertone, whispering."
    },
    "Kray-Z": {
        voiceId: "kray_z", cloneFrom: "jay_z", style: "manic_pitch_swings",
        description: "Jay-Z archetype. Manic, unpredictable pitch swings."
    },
    "Krusha P": {
        voiceId: "krusha_p", cloneFrom: "pusha_t", style: "deadpan_menace",
        description: "Pusha T archetype. Deadpan menace underneath, slick dealer."
    },
    "The Repetition": {
        voiceId: "the_repetition", cloneFrom: "andy_warhol", style: "glitchy_repeat",
        description: "Andy Warhol archetype. Flat affect, literally repeats phrases, glitchy cadence."
    },
    "The Thinker": {
        voiceId: "the_thinker", cloneFrom: "famous_artist", style: "analytical_pauses",
        description: "Overly analytical, pauses mid-sentence to calculate."
    },
    "Locomotive": {
        voiceId: "locomotive", cloneFrom: "stone_cold", style: "relentless_driving",
        description: "Stone Cold archetype. Relentless, driving cadence."
    },
    "John Ford": {
        voiceId: "john_ford", cloneFrom: "john_cena", style: "gravelly_authority",
        description: "John Cena archetype. Gravelly old-guard authority."
    },
    "The Boulder": {
        voiceId: "the_boulder", cloneFrom: "dwayne_the_rock_johnson", style: "electrifying_swagger",
        description: "Dwayne \"The Rock\" Johnson archetype. Electrifying, massive, theatrical delivery, speaks in third person."
    },
    "Ronald Slump": {
        voiceId: "ronald_slump", cloneFrom: "donald_trump", style: "blustery_interrupting",
        description: "Donald Trump archetype. Blustery, interrupts himself, brags mid-sentence."
    },
    "Ronald Slump Jr.": {
        voiceId: "ronald_slump_jr", cloneFrom: "donald_trump_jr_ric_flair", style: "trying_too_hard",
        description: "Donald Trump Jr / Ric Flair archetype. Says woo, eager, voice cracks under pressure."
    },
    "Melissa Kennedy": {
        voiceId: "melissa_kennedy", cloneFrom: "stephanie_mcmahon_chyna", style: "sharp_manager",
        description: "Stephanie McMahon / Chyna archetype. Sharp, in-control manager voice."
    },
    "Drake Vane": {
        voiceId: "drake_vane", cloneFrom: "randy_orton_evolution", style: "snobby_rich",
        description: "Randy Orton Legend Killer archetype. Acts posh, snobby, calls people indie trash."
    },
    
    // ---- ADDITIONS (FROM REPO LOGS/BOOKS) ----
    "Ronye": {
        voiceId: "ronye", cloneFrom: "original", style: "scrappy_mouthy",
        description: "Scrappy underdog archetype, quick and mouthy."
    },
    "Agent Smith": {
        voiceId: "agent_smith", cloneFrom: "original", style: "deadpan_enforcer",
        description: "Corporate Auditors-adjacent, deadpan enforcer archetype, government-suit menace."
    },
    "The Minotaur": {
        voiceId: "the_minotaur", cloneFrom: "original", style: "monstrous_powerhouse",
        description: "Monstrous powerhouse archetype, minimal dialogue, roars over words."
    },
    "The Radiant Child": {
        voiceId: "the_radiant_child", cloneFrom: "basquiat", style: "soft_unsettling",
        description: "Cult-leader/messianic, basquiat type. Soft-spoken but unsettling."
    },
    "Marquis Whitacre": {
        voiceId: "marquis_whitacre", cloneFrom: "original", style: "smooth_villain",
        description: "Smooth, controlled, corporate-villain calm — never raises his voice, except when manic."
    },
    "Tyneshia Hall": {
        voiceId: "tyneshia_hall", cloneFrom: "original", style: "controlled_intensity",
        description: "Controlled intensity, drops into a lower, slower register during God Within moments."
    },
    "Andre Curtis": {
        voiceId: "andre_curtis", cloneFrom: "original", style: "street_psycho",
        description: "Street/cult psycho / cyborg enforcer, short sentences."
    },
    "Edwin John Kennedy": {
        voiceId: "edwin_john_kennedy", cloneFrom: "vince_mcmahon", style: "booming_boss",
        description: "Vince McMahon archetype. Prim old-money diction mixed with booming boss authority."
    },
    "Sam Kennedy": {
        voiceId: "sam_kennedy", cloneFrom: "original", style: "eager_young_brother",
        description: "Younger, faster, trying to prove himself against Edwin."
    }
};

/**
 * Handles the Voice Generation logic bridging the Bannon Engine with a local TTS server (e.g., Coqui/Piper).
 */
export class BannonVoiceGenerator {
    private ttsEndpoint: string;

    constructor() {
        // Points to local Godmode TTS Server (FastAPI hosting Coqui XTTS/Piper)
        this.ttsEndpoint = process.env.LOCAL_TTS_SERVER || "http://localhost:5002/api/tts";
        // In July 2026, we run F5-TTS or Coqui XTTSv2 locally here for 100% free open-source zero-shot cloning.;
    }

    /**
     * Generates stylized VO for a specific character.
     * @param characterName In-game character name
     * @param dialogue The text to speak
     * @param context (Optional) Emotion or context like "godwithin" or "taunt"
     */
    async generateVoice(characterName: string, dialogue: string, context?: string): Promise<Buffer> {
        const charVoice = VoiceMap[characterName as keyof typeof VoiceMap];
        
        if (!charVoice) {
            console.warn(`[VoiceMapper] Character ${characterName} not found in VoiceMap. Using generic voice.`);
        }

        const payload = {
            text: dialogue,
            voice_id: charVoice ? charVoice.voiceId : "generic_male",
            reference_audio: charVoice ? charVoice.cloneFrom : "generic",
            emotion: context || charVoice?.style || "neutral"
        };

        try {
            // Simulated Fetch to local TTS Engine
            console.log(`[VoiceMapper] Sending TTS request for ${characterName} -> ${payload.voice_id} | Context: ${payload.emotion}`);
            console.log(`[VoiceMapper] Dialogue: "${dialogue}"`);
            
            // In a real environment, this makes an HTTP POST to the local Coqui/Piper server.
            // const response = await fetch(this.ttsEndpoint, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });
            // return await response.buffer();
            
            // Simulating successful generation
            return Buffer.from("simulated_wav_data_for_" + characterName);
        } catch (err) {
            console.error(`[VoiceMapper] Failed to generate TTS for ${characterName}:`, err);
            throw err;
        }
    }

    /**
     * Helper to trigger a Reality Check line with heavy reverb/distortion/cadence shift via TTS parameters.
     */
    async triggerGodWithinRealityCheck(characterName: string, dialogue: string): Promise<Buffer> {
        console.log(`[VoiceMapper] Triggering GOD WITHIN Reality Check for ${characterName}`);
        
        // Apply God Within specific distortion/echo modifiers
        let godWithinContext = "intense_revelatory_echo_distortion";
        
        // Character specific God Within overrides
        if (characterName === "Tyneshia Hall" || characterName === "Queen Tyneshia") {
            godWithinContext = "lower_slower_register_deliberate"; // As specified in lore
        } else if (characterName === "Marquis Whitacre") {
            godWithinContext = "out_of_control_manic_distortion";
        }
        
        return this.generateVoice(characterName, dialogue, godWithinContext);
    }
}
