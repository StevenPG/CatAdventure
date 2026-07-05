import { TUNING } from '../config/GameConfig';
import type { CatDefinition } from '../types';

/**
 * THE ROSTER — your 13 cats.
 *
 * Everything about a cat lives here. To add/edit a cat:
 *   1. Give it an id, name, description, and two placeholder colors.
 *   2. Pick `stats` (speed / jumpVelocity / extraJumps / attackReach).
 *   3. Pick an `ability` (active, fires on the special key) from AbilityId.
 *   4. Pick an `effect` (passive screen effect while active) from EffectId.
 *   5. Optionally pick a `quirk` (sprite-level visual flair, e.g. 'wobble').
 *   6. Wire `sounds` keys; load matching audio in PreloadScene later.
 *
 * Names/colors are placeholders — swap in your real cats and art freely.
 * Overlap in abilities is intentional and fine.
 */

// Base values come from the central tuning config; per-cat tweaks are
// expressed as multipliers so changing a base rescales the whole roster.
const BASE_SPEED = TUNING.player.baseSpeed;
const BASE_JUMP = TUNING.player.baseJumpVelocity;
const BASE_REACH = TUNING.player.baseAttackReach;

export const CATS: CatDefinition[] = [
  {
    id: 'eli',
    name: 'Eli',
    description: 'A three-legged gray rocket who never once acted like he was down a paw.',
    bodyColor: 0x9aa1ab,
    faceColor: 0xb0b6be,
    // Very hype: high speed, low jump (down a back leg). Dash = his speed bursts.
    stats: { speed: BASE_SPEED * 1.35, jumpVelocity: BASE_JUMP * 0.8, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'dash',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-dash', select: 'sfx-select' },
  },
  {
    id: 'umbra',
    name: 'Umbra',
    description: 'Big and unhurried. Heavy paws that land like a dropped book.',
    bodyColor: 0x2e2b3d,
    faceColor: 0x4a4570,
    scale: 1.3,
    // Bigger than regular: slow, modest jump, hits HARD (high melee damage),
    // longer reach. Ground-slam doubles down on "hits hard".
    stats: { speed: BASE_SPEED * 0.75, jumpVelocity: BASE_JUMP * 0.85, extraJumps: 0, attackReach: BASE_REACH * 1.15, attackDamage: 3 },
    ability: 'ground-slam',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-slam', select: 'sfx-select' },
  },
  {
    id: 'bucket',
    name: 'Bucket',
    description: 'A slow, solid little tank. Picks a direction and commits.',
    bodyColor: 0x2b2420,
    faceColor: 0x4a3d33,
    scale: 1.18,
    // Big but smaller than Umbra; the slowest cat; low jump. Dash-strike is his
    // "small dash attack" — a short lunge that bowls enemies over.
    stats: { speed: BASE_SPEED * 0.6, jumpVelocity: BASE_JUMP * 0.75, extraJumps: 0, attackReach: BASE_REACH * 1.1, attackDamage: 2 },
    ability: 'dash-strike',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-dash', select: 'sfx-select' },
  },
  {
    id: 'bitty',
    name: 'Bitty',
    description: 'The biggest of them all, and the gentlest. An immovable mountain.',
    bodyColor: 0x232323,
    faceColor: 0x3d3d3d,
    scale: 1.5,
    maxHealth: 14,
    // Biggest cat, biggest tank: most health, slow, low jump, heavy hitter.
    // pound-dash = major ground-pound in the air, short dash on the ground.
    stats: { speed: BASE_SPEED * 0.62, jumpVelocity: BASE_JUMP * 0.72, extraJumps: 0, attackReach: BASE_REACH * 1.2, attackDamage: 3 },
    ability: 'pound-dash',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-slam', select: 'sfx-select' },
  },
  {
    id: 'wilson',
    name: 'Wilson',
    description: 'A one-eyed black cat who takes the long way down, always.',
    bodyColor: 0x1f2233,
    faceColor: 0x35395c,
    // Floats down whenever airborne (feather-fall is passive, no button).
    // Soft vignette nods to the missing eye — set effect to 'none' to drop it.
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'feather-fall',
    effect: 'vignette',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
  },
  {
    id: 'torture-pixie',
    name: 'Pixie',
    description: 'A calico blind in both eyes and skittish — but she can hover like a moth.',
    bodyColor: 0xd98a4f,
    faceColor: 0xf0b878,
    scale: 0.9,
    // Blind: tunnel-vision. Skittish: quick. Hover: hold special in the air.
    stats: { speed: BASE_SPEED * 1.15, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'hover',
    effect: 'tunnel-vision',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-glide', select: 'sfx-select' },
  },
  {
    id: 'milk',
    name: 'Milk',
    description: 'A tiny tuxedo blur — fast, springy, and gone before you blink.',
    bodyColor: 0x1c1c22,
    faceColor: 0xf4f0e6,
    scale: 0.75,
    // Very small, very fast, high jump, fast dash.
    stats: { speed: BASE_SPEED * 1.45, jumpVelocity: BASE_JUMP * 1.3, extraJumps: 0, attackReach: BASE_REACH * 0.9 },
    ability: 'dash',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-dash', select: 'sfx-select' },
  },
  {
    id: 'bones',
    name: 'Bones',
    description: 'A big, not-too-bright orange tabby who somehow outruns everyone.',
    bodyColor: 0xdb6b2c,
    faceColor: 0xf0955a,
    scale: 1.22,
    // Larger and very fast; a bit clumsy (lower jump). No tricks — just speed.
    stats: { speed: BASE_SPEED * 1.5, jumpVelocity: BASE_JUMP * 0.85, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'none',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
  },
  {
    id: 'wobble',
    name: 'Wobble',
    description: 'A wobbly white fluff who rocks and sways but never falls behind.',
    bodyColor: 0xf5f2ea,
    faceColor: 0xffffff,
    // Baseline stats — the wobble is purely a visual tremor, not a handicap.
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'none',
    quirk: 'wobble',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
  },
  {
    id: 'pancake',
    name: 'Pancake',
    description: 'A big black fluffball who drifts down like she weighs nothing at all.',
    bodyColor: 0x232619,
    faceColor: 0x3a3d2e,
    scale: 1.15,
    // Fluffy and light: floats down when airborne.
    stats: { speed: BASE_SPEED * 0.95, jumpVelocity: BASE_JUMP, extraJumps: 1, attackReach: BASE_REACH },
    ability: 'air-glide',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-glide', select: 'sfx-select' },
  },
  {
    id: 'triscuit',
    name: 'Triscuit',
    description: 'A small, multicolored cracker of a cat — springy and quick.',
    bodyColor: 0x9c7a4a,
    faceColor: 0xc9a86a,
    scale: 0.85,
    stats: { speed: BASE_SPEED * 1.1, jumpVelocity: BASE_JUMP * 1.1, extraJumps: 1, attackReach: BASE_REACH },
    ability: 'none',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
  },
  {
    id: 'bonky',
    name: 'Bonky',
    description: 'Small and black with a headbutt that reaches farther than seems possible.',
    bodyColor: 0x2a1f26,
    faceColor: 0x453640,
    scale: 0.85,
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH * 1.7 },
    ability: 'none',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
  },
  {
    id: 'belby',
    name: 'Belby',
    description: 'Small and black, and never gets too close to a fight if she can help it.',
    bodyColor: 0x1a2420,
    faceColor: 0x30443c,
    scale: 0.85,
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'projectile',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-shoot', select: 'sfx-select' },
  },
];

/** Quick lookup by id. */
export const CAT_BY_ID: Record<string, CatDefinition> = Object.fromEntries(
  CATS.map((c) => [c.id, c]),
);

export const DEFAULT_CAT_ID = CATS[0].id;
