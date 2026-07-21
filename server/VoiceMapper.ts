// AI ORIENTATION BLOCK v114
// Godmode TTS Mapping System

import fs from 'fs';
import path from 'path';

// Mapping of in-game character identities to their real-world likeness/parody voice archetypes.
// These archetypes dictate the voice cloning reference to be used (e.g., Coqui XTTS, Piper).
export const VoiceMap = {
    // ---- CORE CHARACTERS ----
    "Tyneshia": {
        voiceId: "tyneshia_godwithin",
        cloneFrom: "reference_tyneshia_promo.wav",
        style: "intense_revelatory",
        description: "Intense, philosophical, authoritative (God Within mode)"
    },
    "Bannon": {
        voiceId: "bannon_main",
        cloneFrom: "bannon_interview_clip.wav",
        style: "commanding",
        description: "Deep, commanding, grizzled veteran"
    },

    // ---- PARODY LIKENESSES ----
    "Judas Messiah": {
        voiceId: "judas_messiah",
        cloneFrom: "reference_chris_jericho.wav",
        style: "arrogant_savior",
        description: "Chris Jericho archetype. Arrogant, charismatic, slow deliberate cadence."
    },
    "The Saint": {
        voiceId: "the_saint",
        cloneFrom: "reference_cm_punk.wav",
        style: "straight_edge_intense",
        description: "CM Punk archetype. Intense, rebellious, sharply articulated."
    },
    "Vain Abel": {
        voiceId: "vain_abel",
        cloneFrom: "reference_kane.wav",
        style: "demonic_growl",
        description: "Kane archetype. Deep, distorted demonic growl, slow speech."
    },
    "The Bad Gal": {
        voiceId: "bad_gal",
        cloneFrom: "reference_rhea_ripley.wav", // Or Rihanna based on prompt interpretation
        style: "punk_aggressive",
        description: "Rhea Ripley archetype. Aggressive, raspy, taunting."
    },
    "Slime & Prince": {
        voiceId: "slime_and_prince",
        cloneFrom: "reference_young_bucks.wav",
        style: "obnoxious_hype",
        description: "Young Bucks / Hype bros archetype. Fast-talking, synchronized, annoying."
    },
    "The Matador": {
        voiceId: "the_matador",
        cloneFrom: "reference_tito_santana.wav",
        style: "proud_heroic",
        description: "Tito Santana / Los Matadores archetype. Proud, rolling R's, traditional babyface."
    },
    "The Phoenix": {
        voiceId: "the_phoenix",
        cloneFrom: "reference_beth_phoenix.wav",
        style: "powerful_confident",
        description: "Beth Phoenix archetype. Strong, confident, deliberate."
    },
    "Slick Willy": {
        voiceId: "slick_willy",
        cloneFrom: "reference_slick.wav",
        style: "jive_manager",
        description: "Slick archetype. Fast-talking, smooth 80s manager jive."
    },
    
    // ---- TAG TEAMS & STABLES ----
    "Spike": {
        voiceId: "spike_bash_brother",
        cloneFrom: "reference_dvon_dudley.wav",
        style: "aggressive_brawler",
        description: "Dudley Boyz archetype. Gruff, loud."
    },
    "Hammer": {
        voiceId: "hammer_bash_brother",
        cloneFrom: "reference_bubba_ray.wav",
        style: "loud_bully",
        description: "Dudley Boyz archetype. Bullying, shouting."
    },
    "Dice": {
        voiceId: "dice_high_roller",
        cloneFrom: "reference_jbl.wav",
        style: "arrogant_rich",
        description: "JBL/APA archetype. Loud, booming, arrogant."
    },
    "Chip": {
        voiceId: "chip_high_roller",
        cloneFrom: "reference_ron_simmons.wav",
        style: "deep_stoic",
        description: "Ron Simmons archetype. Deep bass, short sentences."
    },
    "Air Jordan (Shackle III)": {
        voiceId: "air_jordan",
        cloneFrom: "reference_ricochet.wav",
        style: "energetic_cocky",
        description: "Ricochet/Kofi archetype. High energy, cocky."
    },
    "Tank (Shackle IV)": {
        voiceId: "tank",
        cloneFrom: "reference_tank_abbott.wav",
        style: "gruff_fighter",
        description: "Tank Abbott archetype. Unpolished, gruff, street-fighter."
    },
    "Kid Glide": {
        voiceId: "kid_glide",
        cloneFrom: "reference_rey_mysterio.wav",
        style: "underdog_hero",
        description: "Rey Mysterio archetype. Respectful, fiery underdog."
    },
    "Iron Tusk": {
        voiceId: "iron_tusk",
        cloneFrom: "reference_samoa_joe.wav",
        style: "quiet_menace",
        description: "Samoa Joe archetype. Low register, highly articulate, menacing."
    },
    "Hardcore Harry": {
        voiceId: "hardcore_harry",
        cloneFrom: "reference_hardcore_holly.wav",
        style: "bitter_veteran",
        description: "Hardcore Holly archetype. Bitter, no-nonsense, abrasive."
    },
    "The Luchador Twins": {
        voiceId: "luchador_twins",
        cloneFrom: "reference_lucha_bros.wav",
        style: "intense_spanish",
        description: "Lucha Brothers archetype. Intense, rapid-fire spanglish."
    },
    "The Corporate Auditors": {
        voiceId: "corporate_auditor",
        cloneFrom: "reference_irs.wav",
        style: "smug_bureaucrat",
        description: "IRS/Right to Censor archetype. Monotone, smug, nagging."
    },

    // ---- THE COVEN OF GNARLY (Ministry/Judgment Day) ----
    "Grave": {
        voiceId: "grave_coven",
        cloneFrom: "reference_undertaker.wav",
        style: "slow_ominous",
        description: "Undertaker archetype. Slow, deep, echoing."
    },
    "Jett Gnarly": {
        voiceId: "jett_gnarly",
        cloneFrom: "reference_edge_brood.wav",
        style: "manic_goth",
        description: "Edge (Brood era) archetype. Whispering, manic."
    },
    "Mokk Gnarly": {
        voiceId: "mokk_gnarly",
        cloneFrom: "reference_gangrel.wav",
        style: "growling_vampiric",
        description: "Gangrel archetype. Growling, animalistic."
    },
    "Razor": {
        voiceId: "razor_coven",
        cloneFrom: "reference_razor_ramon.wav",
        style: "machismo_goth",
        description: "Razor Ramon archetype. Smooth, machismo with a dark twist."
    },
    "Crux": {
        voiceId: "crux_coven",
        cloneFrom: "reference_raven.wav",
        style: "nihilistic_grunge",
        description: "Raven archetype. Intellectual, nihilistic, soft-spoken."
    },
    "Luna": {
        voiceId: "luna_coven",
        cloneFrom: "reference_luna_vachon.wav",
        style: "screaming_manic",
        description: "Luna Vachon archetype. Screaming, unhinged."
    },

    // ---- THE DEGENERATES (DX Parody) ----
    "Triple X": {
        voiceId: "triple_x",
        cloneFrom: "reference_triple_h.wav",
        style: "commanding_cocky",
        description: "Triple H archetype. Slow, deliberate, arrogant."
    },
    "Hall Nighter": {
        voiceId: "hall_nighter",
        cloneFrom: "reference_shawn_michaels.wav",
        style: "flamboyant_arrogant",
        description: "Shawn Michaels archetype. Flamboyant, high-energy, arrogant."
    },
    "The Dogg": {
        voiceId: "the_dogg",
        cloneFrom: "reference_road_dogg.wav",
        style: "hype_mc",
        description: "Road Dogg archetype. Rhythmic, rhyming, crowd-work."
    },
    "Ass-Man Billy": {
        voiceId: "ass_man_billy",
        cloneFrom: "reference_billy_gunn.wav",
        style: "loud_cocky",
        description: "Billy Gunn archetype. Loud, booming catchphrases."
    },
    "X-Kid": {
        voiceId: "x_kid",
        cloneFrom: "reference_xpac.wav",
        style: "nasal_hyper",
        description: "X-Pac archetype. Nasal, hyperactive."
    },
    "Melissa Kennedy": {
        voiceId: "melissa_kennedy",
        cloneFrom: "reference_chyna.wav", // Or Stephanie McMahon
        style: "strong_imposing",
        description: "Chyna archetype. Deep, imposing, few words."
    },

    // ---- THE NWC (nWo Parody) ----
    "The Vandal": {
        voiceId: "the_vandal",
        cloneFrom: "reference_hulk_hogan_hollywood.wav",
        style: "raspy_brother",
        description: "Hollywood Hogan archetype. Raspy, uses 'brother/dude'."
    },
    "Vato": {
        voiceId: "vato_nwc",
        cloneFrom: "reference_scott_hall.wav",
        style: "smooth_machismo",
        description: "Scott Hall archetype. 'Hey yo', smooth, relaxed."
    },
    "Big Cash": {
        voiceId: "big_cash",
        cloneFrom: "reference_kevin_nash.wav",
        style: "cool_sarcastic",
        description: "Kevin Nash archetype. Deep voice, slow, very sarcastic."
    },
    "Aaron Reiner": {
        voiceId: "aaron_reiner",
        cloneFrom: "reference_syxx.wav",
        style: "hyper_heel",
        description: "Syxx/Sean Waltman archetype. Fast, abrasive."
    },
    "Toxin": {
        voiceId: "toxin_nwc",
        cloneFrom: "reference_sting_crow.wav",
        style: "whisper_vigilante",
        description: "Crow Sting archetype. Whispering, brooding, minimal dialogue."
    },

    // ---- THE DYNASTY & THE MASTERPIECE ----
    "Kray-Z": {
        voiceId: "kray_z",
        cloneFrom: "reference_jay_z.wav",
        style: "brooklyn_smooth",
        description: "Jay-Z archetype. Cool, calculated, rhythmic speech."
    },
    "Krusha P": {
        voiceId: "krusha_p",
        cloneFrom: "reference_master_p.wav",
        style: "southern_hype",
        description: "Master P archetype. 'Uhh', loud, southern bounce."
    },
    "The Repetition": {
        voiceId: "the_repetition",
        cloneFrom: "reference_echoing.wav",
        style: "rhythmic_chant",
        description: "Conceptual character. Speaks in rhythmic, repeating cadence."
    },
    "The Thinker": {
        voiceId: "the_thinker",
        cloneFrom: "reference_lanny_poffo.wav",
        style: "poetic_condescending",
        description: "The Genius archetype. Uses big words, recites poetry condescendingly."
    },
    "The Velocity": {
        voiceId: "the_velocity",
        cloneFrom: "reference_paul_london.wav",
        style: "frantic_fast",
        description: "Paul London archetype. Frantic, out-of-breath, fast-talking."
    },
    "The Cubist": {
        voiceId: "the_cubist",
        cloneFrom: "reference_artistic_snob.wav",
        style: "avant_garde_snob",
        description: "Avant-garde snob archetype. Uses art terminology, disdainful."
    },

    // ---- THE STRAIGHT SHOOTERS & HOLLYWOOD ----
    "Locomotive": {
        voiceId: "locomotive",
        cloneFrom: "reference_stone_cold.wav",
        style: "intense_brawler",
        description: "Stone Cold Steve Austin archetype. Loud, aggressive, intense."
    },
    "John Ford": {
        voiceId: "john_ford",
        cloneFrom: "reference_john_cena.wav",
        style: "intense_preacher",
        description: "John Cena archetype. Loud, earnest, rises to a screaming crescendo."
    },
    "The Boulder": {
        voiceId: "the_boulder",
        cloneFrom: "reference_the_rock.wav",
        style: "electrifying_cocky",
        description: "The Rock archetype. Third-person references, highly charismatic, dynamic range."
    },
    
    // ---- MANAGEMENT / EXTRAS ----
    "General Vance": {
        voiceId: "general_vance",
        cloneFrom: "reference_vince_mcmahon.wav",
        style: "booming_boss",
        description: "Vince McMahon archetype. Booming, aggressive, iconic growl."
    },
    "Pretty Flacko": {
        voiceId: "pretty_flacko",
        cloneFrom: "reference_asap_rocky.wav",
        style: "harlem_smooth",
        description: "A$AP Rocky archetype. Smooth, fashion-forward, laid back."
    },
    "Club God": {
        voiceId: "club_god",
        cloneFrom: "reference_club_promoter.wav",
        style: "loud_party",
        description: "Hype man/Club promoter archetype. Constant yelling, party energy."
    }
};

/**
 * Handles the Voice Generation logic bridging the Bannon Engine with a local TTS server (e.g., Coqui/Piper).
 */
export class BannonVoiceGenerator {
    private ttsEndpoint: string;

    constructor() {
        // Points to local Godmode TTS Server (FastAPI hosting Coqui XTTS/Piper)
        this.ttsEndpoint = process.env.LOCAL_TTS_SERVER || 'http://localhost:5002/api/tts';
    }

    /**
     * Generates cloned VO for a specific character.
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
            reference_audio: charVoice ? charVoice.cloneFrom : "generic.wav",
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
     * Helper to trigger a Reality Check line with heavy reverb/distortion via TTS parameters.
     */
    async triggerGodWithinRealityCheck(characterName: string, dialogue: string): Promise<Buffer> {
        console.log(`[VoiceMapper] Triggering GOD WITHIN Reality Check for ${characterName}`);
        return this.generateVoice(characterName, dialogue, "intense_revelatory_echo");
    }
}
