/**
 * Central place for tunable constants. Tweak feel here rather than hunting
 * through scene code.
 */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const PHYSICS = {
  gravityY: 1600,
  /** Multiplier applied to a cat's jumpVelocity. Negative = upward. */
  jumpSign: -1,
  /** Horizontal drag when no input is given (snappy stop). */
  dragX: 2400,
  /** Max fall speed so cats don't tunnel through thin platforms. */
  maxFallSpeed: 1400,
} as const;

export const COMBAT = {
  /** Upward bounce after stomping an enemy. */
  stompBounce: 700,
  /** How long the melee attack hitbox stays active (ms). */
  attackDurationMs: 160,
  /** Cooldown between melee attacks (ms). */
  attackCooldownMs: 320,
  playerInvulnMs: 1000,
} as const;

export const COLORS = {
  background: 0x1a1c2c,
  platform: 0x566c86,
  platformBreakable: 0x8b5a2b,
  ground: 0x333c57,
  collectible: 0xffcd75,
  enemy: 0xef7d57,
  projectile: 0x73eff7,
} as const;

/** localStorage key for saved progress. */
export const SAVE_KEY = 'cat-adventure:save:v1';
