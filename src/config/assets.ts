/**
 * ASSET MANIFEST — the single place that says what art and audio the game uses.
 *
 * Everything here ships with a procedurally-generated placeholder so the game
 * runs with zero binary files. To use REAL assets, drop files in `public/` and
 * set the `src` path on the matching entry — the loader uses the file instead
 * of the placeholder, and nothing else has to change.
 *
 *   Sprites:  set `src` to a spritesheet PNG laid out as `frameCount` frames of
 *             `frameWidth`x`frameHeight`, left-to-right.
 *   Audio:    set `src` to a .wav/.mp3/.ogg path.
 */

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
  cat: { frameWidth: 48, frameHeight: 48, frameCount: 10, generator: 'cat' },
  enemy: { frameWidth: 36, frameHeight: 36, frameCount: 6, generator: 'enemy' },
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

// --- Backgrounds -------------------------------------------------------------
// Two pieces: BG_TEXTURES declares every background image (real file via `src`,
// else a generated placeholder), and BACKGROUNDS composes them into named
// themes a level can pick with `background: '<id>'`.

/** How a placeholder background texture is drawn when no real `src` is given. */
export type BgGenerator =
  | { kind: 'sky'; top: number; bottom: number }
  | { kind: 'hills'; color: number; height: number }
  | { kind: 'wall'; base: number; line: number }
  | { kind: 'solid'; color: number };

export interface BgTextureAsset {
  /** Real image path (relative to public/); when set the generator is ignored. */
  src?: string;
  generate: BgGenerator;
}

/** Every background texture the themes reference. Drop a real image by setting
 *  `src` (e.g. 'assets/background/room.png') — the layer keeps its key. */
export const BG_TEXTURES: Record<string, BgTextureAsset> = {
  'bg-sky': { generate: { kind: 'sky', top: 0x1a1c2c, bottom: 0x3b3a6b } },
  'bg-hills-far': { generate: { kind: 'hills', color: 0x29366f, height: 220 } },
  'bg-hills-near': { generate: { kind: 'hills', color: 0x3b5dc9, height: 150 } },
  'bg-room-back': { generate: { kind: 'solid', color: 0x241a2b } },
  'bg-room-wall': { generate: { kind: 'wall', base: 0x342640, line: 0x483452 } },
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
}

export const DEFAULT_BACKGROUND = 'outdoor';

export const BACKGROUNDS: Record<string, BackgroundTheme> = {
  // Outdoor: gradient sky + two parallax hill bands (the original look).
  outdoor: {
    baseColor: 0x1a1c2c,
    layers: [
      { key: 'bg-sky', parallax: 0, tile: false, anchor: 'fill' },
      { key: 'bg-hills-far', parallax: 0.2, anchor: 'bottom', height: 220 },
      { key: 'bg-hills-near', parallax: 0.45, anchor: 'bottom', height: 150 },
    ],
  },
  // Interior room: a fixed dark backing plus a wall pattern that scrolls with
  // the camera (slight parallax) so it reads as a room you move through.
  room: {
    baseColor: 0x241a2b,
    layers: [
      { key: 'bg-room-back', parallax: 0, tile: false, anchor: 'fill' },
      { key: 'bg-room-wall', parallax: 0.65, tile: true, anchor: 'fill' },
    ],
  },
};
