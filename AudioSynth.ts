/**
 * AudioSynth — owns the commentary line database and cue selection.
 * Extracted out of server.ts so the "what gets said and when" logic lives
 * in the node that conceptually owns it (per the Spatial Command
 * Architecture split), instead of being inlined in the HTTP layer.
 * Behavior is unchanged from the original inline COMMENTARY_DB.
 */
export const COMMENTARY_DB = {
  VoiceA: { // The Play-by-Play Lore analyst - clinical, structured, statistical
    genericIntros: [
      "Welcome to the Ouroboros Arena. This matchup sits directly in the crosshairs of competitive wrestling history.",
      "Both fighters represent distinct mathematical layouts in our biomechanical physics ledger.",
      "The spatial parameters look fully optimized tonight. Balance loops and spring dampings are calibrated."
    ],
    rivalryIntros: [
      "A classic bloodline rivalry is reignited tonight. These fighters have pushed each other past absolute structural failure multiple times.",
      "There is profound non-canon and canon lore build-up surrounding this rematch. The history is written in ruptured joints.",
      "An long-standing antagonism resumes. They know each other's weight distribution, muscle spring ratios, and recovery gates perfectly."
    ],
    idleLore: [
      "Notice the active center of mass management. Second-order critically damped controllers are keeping the skeletons upright.",
      "As performance fatigue accumulates, we will observe a significant reduction in skin material roughness.",
      "The bone velocity tracker is constantly calculating target coordinate offsets for the muscle torque equations.",
      "Both athletes are utilizing state-of-the-art Proportional Derivative muscle motors to fight local gravity wells."
    ]
  },
  VoiceB: { // The Visceral Color Commentator - high energy, shocked, impact-driven, loud
    strikes: [
      "BAH GAWD! What an absolute collision of flesh!",
      "He connected flush! That nearly sheared the jaw off the skeletal frame!",
      "A fierce impact! The kinetic energy output from that strike is outstanding!",
      "WHAT A SLAP! The sound resonated right through the arena walls!"
    ],
    slams: [
      "HOLY ALMIGHTY! Dropped with an intense, high-inertia slam!",
      "DUMPED! His spine absorbed the raw impact velocity of that entire mass!",
      "Smashed down! He got driven through the floor boards like concrete!"
    ],
    heavyMoves: {
      powerbomb: [
        "OH MY LORD! A COLLOSSAL POWERBOMB FROM THE HEAVENS!",
        "BAH GAWD, THE POWERBOMB! HE BROKE HIM IN HALF!",
        "CRUSHED! AN ABSOLUTE KINETIC BOMB STRAIGHT TO THE MAT!"
      ],
      suplex: [
        "VERTICAL SUPLEX! He rode the Bezier spline all the way down!",
        "SLAMMING SUPLEX! High parabolic arc of absolute physical destruction!",
        "A BEAUTIFUL THROW FROM DEEP INSIDE THE GRAVITY WELL!"
      ],
      backsuplex: [
        "BACK SUPLEX! Dropped directly onto the base of his neck!",
        "GERMAN SUPLEX! Complete joint rotation and slam!"
      ],
      aerial_dive: [
        "WOW LOOK AT HIM FLY! HE WENT INTO ORBIT!",
        "HE SAILED THROUGH THE SKY LIKE A HIGH-VELOCITY COAL-FIRED FREIGHT TRAIN!",
        "DEATH FROM ABOVE! AN UNBELIEVABLE SACRIFICE SUICIDE FLYING DIVE!"
      ]
    },
    blood: [
      "WE HAVE OUTRIGHT HEAD TRAUMA RUPE! LIQUID GLOSS SPREADING ACROSS THE CAVNAS!",
      "HE IS BUSTED WIDE OPEN! His head stress threshold exceeded the 60% probability barrier!",
      "A HORRIFYING GASH! The red decals are dripping straight under his head coordinate!"
    ],
    knockdown: [
      "DOWN HE GOES! A catastrophic center of mass failure!",
      "FLIPPED! That strike completely deactivated his inner balance loop!",
      "HE COULD NOT CONQUER GRAVITY! THE INVERTED PENDULUM COLLAPSED TO THE FLOOR!"
    ],
    ko: [
      "IT IS OVER! KNOCKOUT! A SYSTEM OVERLOAD AND MOTOR SHUTDOWN!",
      "FINISHED! A VISCERAL ENDING TO A CLINICAL CONFLICT!",
      "GOODNIGHT! THE CPU CALCULATION COMES TO A BRAIN-MATTER END!"
    ]
  }
};

export class AudioSynth {
  constructor() {
    console.log("[Node 9] Audio Synth Initialized");
  }

  public pick(lines: string[]): string {
    return lines[Math.floor(Math.random() * lines.length)];
  }

  public commentaryForMove(category: string, moveId?: string): string {
    if (moveId && (COMMENTARY_DB.VoiceB.heavyMoves as any)[moveId]) {
      return this.pick((COMMENTARY_DB.VoiceB.heavyMoves as any)[moveId]);
    }
    switch (category) {
      case 'strike': return this.pick(COMMENTARY_DB.VoiceB.strikes);
      case 'slam': return this.pick(COMMENTARY_DB.VoiceB.slams);
      default: return this.pick(COMMENTARY_DB.VoiceA.idleLore);
    }
  }

  public commentaryForOutcome(event: 'knockdown' | 'ko' | 'blood'): string {
    return this.pick(COMMENTARY_DB.VoiceB[event]);
  }
}
