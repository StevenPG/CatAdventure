import type Phaser from 'phaser';
import type { Player } from './entities/Player';

/** Active abilities triggered by the special key. Add new ids here, then
 *  register an implementation in cats/abilities/index.ts. */
export type AbilityId =
  | 'none'
  | 'dash'
  | 'dash-strike'
  | 'ground-slam'
  | 'pound-dash'
  | 'projectile'
  | 'air-glide'
  | 'feather-fall'
  | 'hover';

/** Passive screen effects applied while a cat is active. Add new ids here,
 *  then register an implementation in cats/effects/index.ts. */
export type EffectId =
  | 'none'
  | 'vignette'
  | 'tunnel-vision'
  | 'night-vision'
  | 'warm-glow';

export interface CatStats {
  /** Horizontal run speed (px/s). */
  speed: number;
  /** Jump impulse magnitude (px/s). Higher = higher jump. */
  jumpVelocity: number;
  /** Extra mid-air jumps. 0 = single jump, 1 = double jump, etc. */
  extraJumps: number;
  /** Width of the melee attack hitbox (px). "Longer reach" cats raise this. */
  attackReach: number;
  /** Melee damage per swipe. Defaults to TUNING.combat.attackDamage when unset.
   *  "Hits hard" cats raise this. */
  attackDamage?: number;
}

/** Sound keys the AudioManager will play. These are stubbed for now; drop real
 *  audio in PreloadScene under the same keys and they light up automatically. */
export interface CatSounds {
  jump?: string;
  attack?: string;
  ability?: string;
  hurt?: string;
  select?: string;
}

export interface CatDefinition {
  id: string;
  /** Display name (placeholder — rename to your real cats). */
  name: string;
  /** One-line flavor / what makes this cat special. */
  description: string;
  /** Placeholder body color; also tints the shared placeholder sprite sheet. */
  bodyColor: number;
  /** Color of this cat's face in the switch bar. */
  faceColor: number;
  /** Spritesheet texture key (see config/assets.ts SHEETS). Defaults to the
   *  shared 'cat' placeholder. Set per-cat once real art is added. */
  spriteSheet?: string;
  /** Visual size multiplier. >1 = bigger cat, <1 = smaller. Defaults to 1. */
  scale?: number;
  /** Max health (hearts). Defaults to TUNING.player.maxHealth. Tank cats raise
   *  this. Health is tracked as damage-taken, so switching cats adjusts the
   *  effective buffer without healing or instantly killing you. */
  maxHealth?: number;
  stats: CatStats;
  ability: AbilityId;
  effect: EffectId;
  sounds: CatSounds;
}

/** What an Ability implementation receives. Decoupled from the concrete scene
 *  via the GameWorld interface so abilities don't hard-depend on GameScene. */
export interface AbilityContext {
  player: Player;
  world: GameWorld;
  /** Direction the player is facing: 1 = right, -1 = left. */
  facing: number;
}

export interface Ability {
  readonly id: AbilityId;
  /** Cooldown before the ability can fire again (ms). */
  readonly cooldownMs: number;
  /** Fired when the special key is pressed. Return true if the ability
   *  actually triggered (used to gate the cooldown + sound). */
  activate(ctx: AbilityContext): boolean;
  /** Optional per-frame hook for ongoing effects (e.g. glide). */
  update?(ctx: AbilityContext, deltaMs: number): void;
}

/** Minimal surface the gameplay scene exposes to abilities/effects, so those
 *  modules stay decoupled from the full GameScene implementation. */
export interface GameWorld extends Phaser.Scene {
  spawnProjectile(x: number, y: number, direction: number, reach: number): void;
  damageEnemiesInRadius(x: number, y: number, radius: number, damage?: number): void;
  shatterBreakablesInRadius(x: number, y: number, radius: number): void;
}

/** Per-level definition. Edit data/levels.ts to add or reshape levels. */
export interface LevelDefinition {
  id: string;
  name: string;
  /** World bounds. */
  width: number;
  height: number;
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  platforms: PlatformDef[];
  enemies: { x: number; y: number; patrol?: number }[];
  collectibles: { x: number; y: number }[];
  /** Optional: platforms that travel between two points (you can ride them). */
  movingPlatforms?: MovingPlatformDef[];
  /** Optional: damaging zones (spikes). */
  hazards?: HazardDef[];
  /** Optional: gravity-free patrolling enemies. */
  flyingEnemies?: FlyingEnemyDef[];
}

export interface PlatformDef {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Breakable by ground-slam. */
  breakable?: boolean;
}

/** A platform that ping-pongs between its start (x,y) and (toX,toY). The player
 *  is carried while standing on it. x/y are the top-left at the start. */
export interface MovingPlatformDef {
  x: number;
  y: number;
  width: number;
  height: number;
  toX: number;
  toY: number;
  /** Travel speed (px/s). Defaults to TUNING.movingPlatform.speed. */
  speed?: number;
}

/** A static damaging zone (spikes). x/y is the top-left. */
export interface HazardDef {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Damage on contact. Defaults to TUNING.hazards.damage. */
  damage?: number;
}

/** A flying enemy: ignores gravity, drifts on a sine path around (x,y). */
export interface FlyingEnemyDef {
  x: number;
  y: number;
  /** Horizontal half-range of the path (px). 0 = no horizontal motion. */
  rangeX?: number;
  /** Vertical bob amplitude (px). 0 = none. */
  rangeY?: number;
  /** Path speed (px/s). Defaults to TUNING.flyingEnemy.speed. */
  speed?: number;
}

/** Common surface for ground + flying enemies, so combat treats them alike. */
export interface EnemyLike {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  hurt(damage?: number): boolean;
  update(): void;
}

export interface SaveData {
  /** Highest level index unlocked (0-based). */
  unlockedLevel: number;
  /** Per-level best: collectibles gathered. Keyed by level id. */
  levelStats: Record<string, { collected: number; completed: boolean }>;
  /** Last cat the player selected (id). */
  lastCatId: string | null;
}
