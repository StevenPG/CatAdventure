/**
 * ALL gameplay tuning lives here. Tweak feel in one place — jump height, attack
 * reach, ability params, respawn timing, etc. Per-cat values in data/cats.ts
 * are expressed as multipliers of these base numbers, so changing a base here
 * scales the whole roster.
 */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** localStorage key for saved progress. */
export const SAVE_KEY = 'cat-adventure:save:v1';

export const TUNING = {
  physics: {
    gravityY: 1600,
    /** Horizontal drag when no input is given (snappy stop). */
    dragX: 2400,
    /** Max fall speed so cats don't tunnel through thin platforms. */
    maxFallSpeed: 1400,
    /** Sign applied to jump velocity. Negative = upward. */
    jumpSign: -1,
  },

  player: {
    /** Base horizontal run speed (px/s). */
    baseSpeed: 240,
    /** Base jump impulse (px/s). Higher = higher jump. */
    baseJumpVelocity: 720,
    /** Base melee attack hitbox width (px). "Longer reach" cats scale this up. */
    baseAttackReach: 56,
    maxHealth: 9,
  },

  combat: {
    /** Upward bounce after stomping an enemy. */
    stompBounce: 700,
    /** Downward speed needed (and being above the enemy) to count as a stomp. */
    stompVelocityThreshold: 80,
    /** How long the melee attack visual/anim lasts (ms). */
    attackDurationMs: 160,
    /** Cooldown between melee attacks (ms). */
    attackCooldownMs: 320,
    /** Damage dealt by a melee swipe. */
    attackDamage: 1,
    /** Damage dealt by stomping an enemy from above. */
    stompDamage: 2,
    /** Invulnerability window after taking a hit (ms). */
    playerInvulnMs: 1000,
  },

  enemy: {
    speed: 70,
  },

  /** Active-ability parameters. Each maps to an Ability implementation. */
  abilities: {
    dash: { speed: 720, durationMs: 160, cooldownMs: 700, groundLiftY: 120 },
    dashStrike: { speed: 540, durationMs: 150, cooldownMs: 800, groundLiftY: 60, damage: 2 },
    groundSlam: { speed: 1400, impactRadius: 90, damage: 2, cooldownMs: 600 },
    projectile: { speed: 560, lifespanMs: 1400, cooldownMs: 450, spawnOffset: 24, damage: 1 },
    airGlide: { fallSpeed: 90 },
  },

  /** Soft-respawn (no game-over): message beat, then scroll back to start. */
  respawn: {
    messageDelayMs: 850,
    panDurationMs: 850,
    invulnMs: 900,
  },
} as const;

export const COLORS = {
  background: 0x1a1c2c,
  platform: 0x566c86,
  platformTop: 0x94b0c2,
  platformBreakable: 0x8b5a2b,
  platformBreakableTop: 0xc98c5a,
  ground: 0x333c57,
  collectible: 0xffcd75,
  enemy: 0xef7d57,
  projectile: 0x73eff7,
  exit: 0xa7f070,
} as const;
