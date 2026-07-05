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
    /** Max fall speed. Kept moderate so a body can't punch through a thin
     *  platform between physics steps (Arcade has no swept collision); at 60fps
     *  1100/60 ≈ 18px/step, well under the ~24px thinnest platform. */
    maxFallSpeed: 1100,
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
    /** Grace period (ms) to still ground-jump after walking off a ledge. */
    coyoteMs: 90,
    /** Pressing jump this long (ms) before landing still triggers the jump. */
    jumpBufferMs: 120,
    /** Releasing jump while rising multiplies upward velocity by this
     *  (variable jump height — tap for short hops, hold for full jumps). */
    jumpCutMultiplier: 0.45,
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

  /** Active-ability parameters. Each maps to an Ability implementation. */
  abilities: {
    dash: { speed: 720, durationMs: 160, cooldownMs: 700, groundLiftY: 120 },
    dashStrike: { speed: 540, durationMs: 150, cooldownMs: 800, groundLiftY: 60, damage: 2 },
    // speed is capped by maxFallSpeed; kept at that ceiling for a snappy slam.
    groundSlam: { speed: 1100, impactRadius: 90, damage: 2, shake: 0.008, cooldownMs: 600 },
    // Context-sensitive: major slam in the air, short dash on the ground.
    poundDash: {
      slamSpeed: 1100,
      impactRadius: 150,
      slamDamage: 4,
      slamShake: 0.018,
      dashSpeed: 460,
      dashDurationMs: 120,
      dashGroundLiftY: 40,
      cooldownMs: 800,
    },
    // Passive gentle descent whenever airborne.
    featherFall: { fallSpeed: 140 },
    // Hold the special key in the air to hover (gentle lift), limited by fuel
    // that refills on landing so it can't trivialize a level.
    hover: { liftVelocityY: -20, fuelMs: 1300 },
    projectile: { speed: 560, lifespanMs: 1400, cooldownMs: 450, spawnOffset: 24, damage: 1 },
    airGlide: { fallSpeed: 90 },
    // A springy diagonal leap (ground only); enemies hit mid-arc take damage.
    pounce: { speedX: 500, speedY: 640, durationMs: 420, damage: 2, cooldownMs: 900 },
    // A burst of frenzied speed with an afterimage trail. No damage — pure go.
    zoomies: { speedMultiplier: 1.9, durationMs: 1600, cooldownMs: 4200 },
    // A radial shockwave "bonk": damages everything nearby, rings + shake.
    sonicMeow: { radius: 130, damage: 1, shake: 0.007, cooldownMs: 1100 },
    // A brief spin that damages enemies around the cat in ticks while it lasts.
    whirlwind: { radius: 80, damage: 1, durationMs: 500, tickMs: 170, spins: 2, cooldownMs: 1200 },
  },

  /** Cosmetic juice shared by abilities: afterimage trails behind dashes,
   *  pounces, and zoomies. Purely visual. */
  fx: {
    /** Min gap between afterimage ghosts (ms). */
    trailIntervalMs: 40,
    /** Starting alpha of each ghost. */
    trailAlpha: 0.35,
    /** How long a ghost takes to fade out (ms). */
    trailFadeMs: 240,
    /** Tint for kicked-up dust puffs (dashes, pounces, slam landings). */
    dustColor: 0xcfc6b8,
  },

  /** Soft-respawn (no game-over): message beat, then scroll back to start. */
  respawn: {
    messageDelayMs: 850,
    panDurationMs: 850,
    invulnMs: 900,
  },

  /** Platforms that travel between two points (you ride them). */
  movingPlatform: { speed: 80 },

  /** Damaging zones (spikes). Knockback is applied away/up from the hit. */
  hazards: { damage: 1, knockbackX: 220, knockbackY: 340 },

  /** Gravity-free patrolling enemies. */
  flyingEnemy: { speed: 90, rangeX: 90, rangeY: 30 },

  /** Sprite-level visual quirks (see QuirkId), purely cosmetic. */
  quirks: {
    /** A continuous side-to-side rocking tremor layered over any animation. */
    wobble: { angleDeg: 9, jitterDeg: 3, speed: 5.5, jitterSpeed: 14.8 },
  },

  audio: {
    /** Background music volume (sfx play at full; global mute covers both). */
    musicVolume: 0.4,
  },

  /** Per-kind enemy behaviour. 'walker' is the classic patroller. */
  enemyKinds: {
    walker: { speed: 70 },
    /** Hops in arcs along its patrol; flips at bounds/walls. */
    hopper: { intervalMs: 1300, hopVx: 150, hopVy: 520, scale: 0.9, tint: 0x38b2a3 },
    /** Patrols slowly; telegraphs, then charges when the cat is level with it. */
    charger: {
      patrolSpeed: 45,
      chargeSpeed: 330,
      telegraphMs: 450,
      /** Horizontal detection range (px) and vertical tolerance (px). */
      range: 260,
      verticalTolerance: 70,
      /** Max charge duration before giving up (ms). */
      chargeMaxMs: 1300,
      cooldownMs: 1100,
      scale: 1.12,
      tint: 0xc23c4f,
      hp: 2,
    },
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
  flyer: 0xb18bd6,
  projectile: 0x73eff7,
  exit: 0xa7f070,
  movingPlatform: 0x4a9c8a,
  movingPlatformTop: 0x7fd6c2,
  hazard: 0xb13e53,
  hazardSpike: 0xef7d57,
  checkpointInactive: 0x566c86,
  checkpointActive: 0xffcd75,
} as const;
