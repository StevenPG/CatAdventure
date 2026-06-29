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
    id: 'dasher',
    name: 'Dasher',
    description: 'Blink-fast. Dashes through danger.',
    bodyColor: 0x73eff7,
    faceColor: 0x73eff7,
    stats: { speed: BASE_SPEED * 1.15, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'dash',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-dash', select: 'sfx-select' },
  },
  {
    id: 'tank',
    name: 'Tank',
    description: 'Heavyset. Ground-slams through breakable blocks.',
    bodyColor: 0x333c57,
    faceColor: 0x566c86,
    stats: { speed: BASE_SPEED * 0.85, jumpVelocity: BASE_JUMP * 0.95, extraJumps: 0, attackReach: BASE_REACH * 1.1 },
    ability: 'ground-slam',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-slam', select: 'sfx-select' },
  },
  {
    id: 'spitter',
    name: 'Spitter',
    description: 'Hocks a furball projectile at range.',
    bodyColor: 0x94b0c2,
    faceColor: 0x94b0c2,
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'projectile',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-shoot', select: 'sfx-select' },
  },
  {
    id: 'reacher',
    name: 'Reacher',
    description: 'Long limbs, long swipe. Hits enemies from afar.',
    bodyColor: 0xb13e53,
    faceColor: 0xb13e53,
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH * 1.9 },
    ability: 'none',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
  },
  {
    id: 'zoomie',
    name: 'Zoomie',
    description: 'Pure speed. The 3am-sprint cat.',
    bodyColor: 0xa7f070,
    faceColor: 0xa7f070,
    stats: { speed: BASE_SPEED * 1.4, jumpVelocity: BASE_JUMP, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'dash',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', ability: 'sfx-dash', select: 'sfx-select' },
  },
  {
    id: 'hops',
    name: 'Hops',
    description: 'Sky-high jumper. Clears the tallest gaps.',
    bodyColor: 0xf4f4f4,
    faceColor: 0xf4f4f4,
    stats: { speed: BASE_SPEED, jumpVelocity: BASE_JUMP * 1.35, extraJumps: 0, attackReach: BASE_REACH },
    ability: 'none',
    effect: 'none',
    sounds: { jump: 'sfx-jump', attack: 'sfx-attack', select: 'sfx-select' },
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
