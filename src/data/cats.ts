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
 *   5. Wire `sounds` keys; load matching audio in PreloadScene later.
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
    bodyColor: 0x9badb7,
    faceColor: 0x9badb7,
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
    bodyColor: 0x423d5c,
    faceColor: 0x6b6391,
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
    bodyColor: 0xa87c50,
    faceColor: 0xc89b6a,
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
    bodyColor: 0x5b6b8c,
    faceColor: 0x8295b8,
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
    bodyColor: 0x2b2f42,
    faceColor: 0x6a7290,
    // Floats down whenever airborne (feather-fall is passive, no button).
    // Soft vignette nods to the missing eye — set effect to 'none' to drop it.
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'feather-fall',
    effect: 'vignette',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
  },
  {
    id: 'torture-pixie',
    name: 'Torture Pixie',
    description: 'Blind in both eyes and skittish — but she can hover like a moth.',
    bodyColor: 0xd98cb3,
    faceColor: 0xeaa9cc,
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
    description: 'A tiny white blur — fast, springy, and gone before you blink.',
    bodyColor: 0xf4f0e6,
    faceColor: 0xfbf8f0,
    scale: 0.75,
    // Very small, very fast, high jump, fast dash.
    stats: { speed: BASE_SPEED * 1.45, jumpVelocity: BASE_JUMP * 1.3, extraJumps: 0, attackReach: BASE_REACH * 0.9 },
    ability: 'dash',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-dash', select: 'sfx-select' },
  },
  {
    id: 'glider',
    name: 'Glider',
    description: 'Floats gently. Hold jump to glide.',
    bodyColor: 0x257179,
    faceColor: 0x38b2a3,
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 1, attackReach: BASE_REACH },
    ability: 'air-glide',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-glide', select: 'sfx-select' },
  },
  {
    id: 'shadow',
    name: 'Shadow',
    description: 'Blind, but fearless. Sees only what is close.',
    bodyColor: 0x29366f,
    faceColor: 0x3b5dc9,
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'none',
    effect: 'tunnel-vision',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
  },
  {
    id: 'dusk',
    name: 'Dusk',
    description: 'Low-vision senior. The edges go soft and dim.',
    bodyColor: 0x5d275d,
    faceColor: 0x7b3f7b,
    stats: { speed: BASE_SPEED * 0.95, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'none',
    effect: 'vignette',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
  },
  {
    id: 'nox',
    name: 'Nox',
    description: 'Night hunter. The world glows green to her eyes.',
    bodyColor: 0x1a1c2c,
    faceColor: 0x38d973,
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'projectile',
    effect: 'night-vision',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-shoot', select: 'sfx-select' },
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Warm old soul. The screen glows golden around her.',
    bodyColor: 0xef7d57,
    faceColor: 0xffcd75,
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP * 1.1, extraJumps: 0, attackReach: BASE_REACH * 1.2 },
    ability: 'ground-slam',
    effect: 'warm-glow',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-slam', select: 'sfx-select' },
  },
  {
    id: 'whiskers',
    name: 'Whiskers',
    description: 'The all-rounder. Balanced, dependable, beloved.',
    bodyColor: 0xc0cbdc,
    faceColor: 0xc0cbdc,
    stats: { speed: BASE_SPEED * 1.05, jumpVelocity: BASE_JUMP * 1.05, extraJumps: 1, attackReach: BASE_REACH * 1.1 },
    ability: 'dash',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-dash', select: 'sfx-select' },
  },
];

/** Quick lookup by id. */
export const CAT_BY_ID: Record<string, CatDefinition> = Object.fromEntries(
  CATS.map((c) => [c.id, c]),
);

export const DEFAULT_CAT_ID = CATS[0].id;
