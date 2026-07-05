/**
 * ASSET MANIFEST — the single place that says what art and audio the game uses.
 *
 * Every sprite and sound is a REAL FILE under public/assets/ (generated
 * placeholders committed to the repo). To use your own art/audio, just overwrite
 * the matching file — keep the name, dimensions, and (for sheets) frame layout.
 * Nothing else has to change. See public/assets/README.md.
 *
 *   Cat sprites:  public/assets/cats/<id>.png   (48x48, 10 frames, left-to-right)
 *   Enemy sprite: public/assets/enemies/enemy.png (36x36, 6 frames)
 *   Sounds:       public/assets/sfx/<key>.wav   (.wav/.mp3/.ogg)
 *
 * (Clearing an entry's `src` falls back to the built-in procedural generator.)
 */
import { CATS } from '../data/cats';

/** A single animation: which frame indices, how fast, and repeat (-1 = loop). */
export interface AnimDef {
  frames: number[];
  frameRate: number;
  repeat: number;
}

export interface SheetAsset {
  /** Real file path; when undefined a placeholder is generated. */
  src?: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  /** Which placeholder generator to use when `src` is undefined. */
  generator: 'cat' | 'enemy';
}

export interface ToneSpec {
  freq: number;
  durationMs: number;
  type: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
  /** Optional end frequency for a pitch sweep. */
  sweepTo?: number;
  volume?: number;
}

export interface SfxAsset {
  /** Real file path; when undefined a placeholder tone is synthesized. */
  src?: string;
  tone: ToneSpec;
}

// --- Spritesheets ------------------------------------------------------------
// Placeholders are shared & tinted per-cat. For real art, give each cat its own
// entry/texture key here and set `spriteSheet` on the cat in data/cats.ts.

export const SHEETS: Record<string, SheetAsset> = {
  // One spritesheet FILE per cat at public/assets/cats/<id>.png — overwrite one
  // to give that cat real art. Built from the roster so ids stay in sync.
  ...Object.fromEntries(
    CATS.map((cat) => [
      `cat-${cat.id}`,
      { src: `assets/cats/${cat.id}.png`, frameWidth: 48, frameHeight: 48, frameCount: 10, generator: 'cat' as const },
    ]),
  ),
  enemy: { src: 'assets/enemies/enemy.png', frameWidth: 36, frameHeight: 36, frameCount: 6, generator: 'enemy' },
};

/** Animation layout for any cat spritesheet (frame indices into the 10 frames).
 *  Real per-cat sheets just need to match this frame ordering:
 *  0-2 idle (incl. blink), 3-6 run cycle, 7 jump, 8 fall, 9 attack. */
export const CAT_ANIMS: Record<string, AnimDef> = {
  idle: { frames: [0, 1, 0, 2], frameRate: 3, repeat: -1 },
  run: { frames: [3, 4, 5, 6], frameRate: 12, repeat: -1 },
  jump: { frames: [7], frameRate: 1, repeat: 0 },
  fall: { frames: [8], frameRate: 1, repeat: 0 },
  attack: { frames: [9], frameRate: 1, repeat: 0 },
};

/** Enemy sheet layout: 0-1 idle (incl. blink), 2-5 walk cycle. */
export const ENEMY_ANIMS: Record<string, AnimDef> = {
  idle: { frames: [0, 1], frameRate: 2, repeat: -1 },
  walk: { frames: [2, 3, 4, 5], frameRate: 8, repeat: -1 },
};

// --- Sound effects -----------------------------------------------------------

export const SFX: Record<string, SfxAsset> = {
  'sfx-jump': { tone: { freq: 420, sweepTo: 720, durationMs: 140, type: 'square', volume: 0.25 } },
  'sfx-attack': { tone: { freq: 300, sweepTo: 160, durationMs: 110, type: 'sawtooth', volume: 0.25 } },
  'sfx-dash': { tone: { freq: 600, sweepTo: 1100, durationMs: 160, type: 'sine', volume: 0.25 } },
  'sfx-slam': { tone: { freq: 200, sweepTo: 60, durationMs: 220, type: 'square', volume: 0.3 } },
  'sfx-shoot': { tone: { freq: 880, sweepTo: 520, durationMs: 120, type: 'triangle', volume: 0.22 } },
  'sfx-glide': { tone: { freq: 500, sweepTo: 560, durationMs: 200, type: 'sine', volume: 0.15 } },
  'sfx-hurt': { tone: { freq: 320, sweepTo: 120, durationMs: 220, type: 'noise', volume: 0.25 } },
  'sfx-select': { tone: { freq: 660, sweepTo: 990, durationMs: 90, type: 'triangle', volume: 0.2 } },
  'sfx-collect': { tone: { freq: 800, sweepTo: 1200, durationMs: 120, type: 'sine', volume: 0.22 } },
};
// Each sound is a real file at public/assets/sfx/<key>.wav — overwrite to
// replace. (Clear a `src` to fall back to the synthesized tone.)
for (const key of Object.keys(SFX)) SFX[key].src ??= `assets/sfx/${key}.wav`;

// --- Background music ----------------------------------------------------------
// Looping tracks — real files at public/assets/music/<key>.wav. Overwrite one
// with your own audio to replace it (the decoder sniffs content, so mp3/ogg
// bytes work even under the .wav name). If a file goes missing, a melody is
// regenerated from `gen`.

export interface MusicAsset {
  src?: string;
  gen: { seed: number; bpm: number; rootHz: number; minor?: boolean };
}

export const MUSIC: Record<string, MusicAsset> = {
  'music-menu': { src: 'assets/music/music-menu.wav', gen: { seed: 7, bpm: 84, rootHz: 196 } },
  'music-outdoor': { src: 'assets/music/music-outdoor.wav', gen: { seed: 3, bpm: 104, rootHz: 220 } },
  'music-room': { src: 'assets/music/music-room.wav', gen: { seed: 11, bpm: 76, rootHz: 174.6, minor: true } },
};

// --- Backgrounds -------------------------------------------------------------
// Two pieces: BG_TEXTURES declares every background image (real file via `src`,
// else a generated placeholder), and BACKGROUNDS composes them into named
// themes a level can pick with `background: '<id>'`.

/** How a placeholder background texture is drawn when no real `src` is given.
 *  The `panel`/`stripes`/`tiles` patterns draw white lines on transparent, so a
 *  layer using one is tinted per-theme and scrolls over the room's base colour. */
export type BgGenerator =
  | { kind: 'sky'; top: number; bottom: number }
  | { kind: 'hills'; color: number; height: number }
  | { kind: 'solid'; color: number }
  | { kind: 'panel' }
  | { kind: 'stripes' }
  | { kind: 'tiles' };

export interface BgTextureAsset {
  /** Real image path (relative to public/); when set the generator is ignored. */
  src?: string;
  generate: BgGenerator;
}

/** Every background texture the themes reference. Drop a real image by setting
 *  `src` (e.g. 'assets/background/living-room.png') — the layer keeps its key. */
export const BG_TEXTURES: Record<string, BgTextureAsset> = {
  'bg-sky': { generate: { kind: 'sky', top: 0x1a1c2c, bottom: 0x3b3a6b } },
  'bg-hills-far': { generate: { kind: 'hills', color: 0x29366f, height: 220 } },
  'bg-hills-near': { generate: { kind: 'hills', color: 0x3b5dc9, height: 150 } },
  // Shared, tintable wall patterns (white lines on transparent) for interiors.
  'bg-panel': { generate: { kind: 'panel' } },
  'bg-stripes': { generate: { kind: 'stripes' } },
  'bg-tiles': { generate: { kind: 'tiles' } },
};

/** One background layer. `tile: false` = a single fixed full-screen image (best
 *  with parallax 0). `tile: true` (default) = a repeating pattern that scrolls
 *  at `parallax` (0 = fixed, 1 = moves with the world). `anchor` places tiled
 *  bands: 'fill' covers the screen (rooms), 'bottom'/'top' are strips (hills). */
export interface BackgroundLayer {
  key: string;
  parallax: number;
  tile?: boolean;
  anchor?: 'bottom' | 'top' | 'fill';
  height?: number;
  tint?: number;
}

export interface BackgroundTheme {
  /** Solid colour drawn behind all layers. */
  baseColor?: number;
  layers: BackgroundLayer[];
  /** Default looping track for levels using this theme (see MUSIC). */
  music?: string;
}

export const DEFAULT_BACKGROUND = 'outdoor';

/** An interior room: a flat wall colour with a tinted, scrolling wall pattern
 *  over it. Generic placeholders for rooms in the house — replace the pattern
 *  with real art by giving these BG_TEXTURES a `src`, or add per-room textures. */
function room(wall: number, pattern: 'bg-panel' | 'bg-stripes' | 'bg-tiles', line: number): BackgroundTheme {
  return {
    baseColor: wall,
    layers: [{ key: pattern, parallax: 0.6, tile: true, anchor: 'fill', tint: line }],
    music: 'music-room',
  };
}

export const BACKGROUNDS: Record<string, BackgroundTheme> = {
  // Outdoor: gradient sky + two parallax hill bands (the original look).
  outdoor: {
    baseColor: 0x1a1c2c,
    layers: [
      { key: 'bg-sky', parallax: 0, tile: false, anchor: 'fill' },
      { key: 'bg-hills-far', parallax: 0.2, anchor: 'bottom', height: 220 },
      { key: 'bg-hills-near', parallax: 0.45, anchor: 'bottom', height: 150 },
    ],
    music: 'music-outdoor',
  },

  // House rooms (generic placeholders — swap in real art later per BG_TEXTURES).
  basement: room(0x2b2f36, 'bg-panel', 0x3f454f), // cool concrete + paneling
  'living-room': room(0x5c4736, 'bg-stripes', 0x715845), // warm wall + wallpaper
  bedroom: room(0x3a3f5c, 'bg-stripes', 0x4a5170), // dusty blue + wallpaper
  kitchen: room(0x55503f, 'bg-tiles', 0x6b6650), // warm cream + tile
  bathroom: room(0x2f4a49, 'bg-tiles', 0x3f5f5e), // teal + tile
  hallway: room(0x3a322e, 'bg-panel', 0x4a4038), // neutral + paneling
  attic: room(0x2e241c, 'bg-panel', 0x3f3020), // dark wood + paneling
  // Generic interior alias (kept so any older `background: 'room'` still works).
  room: room(0x241a2b, 'bg-panel', 0x3a2e40),
};
