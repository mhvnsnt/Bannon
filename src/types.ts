export type SkillKey = 'fetch_api' | 'canvas_2d' | 'audio_api' | 'local_storage' | 'dom_manipulation' | 'string_manipulation' | 'math_physics' | 'timing_events' | 'loops_logic';

export interface SkillTreeData {
  skills: Record<SkillKey, { unlocked: boolean }>;
  xp: number;
}

export interface ProjectDef {
  id: string;
  name: string;
  description: string;
  requires: SkillKey[];
  isHybrid?: boolean;
}

export const INITIAL_SKILL_TREE: SkillTreeData = {
  xp: 0,
  skills: {
    'fetch_api': { unlocked: true },
    'canvas_2d': { unlocked: true },
    'audio_api': { unlocked: false },
    'local_storage': { unlocked: true },
    'dom_manipulation': { unlocked: true },
    'string_manipulation': { unlocked: true },
    'math_physics': { unlocked: true },
    'timing_events': { unlocked: true },
    'loops_logic': { unlocked: true },
  }
};

export const CAPSTONE_PROJECTS: ProjectDef[] = [
  {
    id: 'audio_visualizer',
    name: 'The Audio Visualizer',
    description: 'A script that generates an expanding neon circle on a pitch-black canvas that pulses perfectly to the bass.',
    requires: ['canvas_2d', 'audio_api']
  },
  {
    id: 'crypto_ticker',
    name: 'The Crypto Panic Ticker',
    description: 'A sleek dashboard that rips live Ethereum or Bitcoin prices every 5 seconds. Red for drop, green for up.',
    requires: ['fetch_api']
  },
  {
    id: 'micro_clicker',
    name: 'The 60-Second Micro-Clicker',
    description: 'A frantic 2D game where a target square teleports. You have 60 seconds to click it as many times as possible.',
    requires: ['local_storage', 'timing_events']
  },
  {
    id: 'beat_pad',
    name: 'The Hertz Beat Pad',
    description: 'A grid of 9 buttons on the screen. Hit keys to trigger raw 808 sub-bass frequencies and change screen colors.',
    requires: ['audio_api', 'dom_manipulation']
  },
  {
    id: 'matrix_scrambler',
    name: 'The Matrix Scrambler',
    description: 'Paste text, and it translates into leetspeak or scrambles vowels, dripping text like the Matrix.',
    requires: ['string_manipulation']
  },
  {
    id: 'physics_ball_pit',
    name: 'The Physics Ball Pit',
    description: 'Write gravity. Click anywhere, a ball drops and bounces back up with diminishing velocity until it settles.',
    requires: ['math_physics']
  },
  {
    id: 'color_clock',
    name: 'The Color Clock',
    description: 'A digital clock that converts Time to a HEX color code and sets the background to that exact color.',
    requires: ['timing_events', 'dom_manipulation']
  },
  {
    id: 'paintbrush_tool',
    name: 'The Paintbrush Tool',
    description: 'A blank canvas where holding down the mouse lets you draw a line that changes colors as you drag.',
    requires: ['canvas_2d']
  },
  {
    id: 'css_3d_cube',
    name: 'The CSS 3D Cube',
    description: 'Using only CSS and JS, build a spinning 3D cube out of standard boxes that speeds up when clicked.',
    requires: ['dom_manipulation']
  },
  {
    id: 'password_cracker',
    name: 'The Password Cracker Simulator',
    description: 'Type a password. The JS runs a loop trying combinations until it guesses it, showing the process.',
    requires: ['loops_logic', 'string_manipulation']
  },
  {
    id: 'god_build',
    name: 'The God Build',
    description: 'A micro-clicker game with a live crypto ticker background, playing hertz frequencies on clicks.',
    requires: ['fetch_api', 'audio_api', 'timing_events', 'dom_manipulation'],
    isHybrid: true
  }
];
