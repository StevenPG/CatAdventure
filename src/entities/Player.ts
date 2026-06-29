import Phaser from 'phaser';
import type { Ability, CatDefinition, CatStats, GameWorld } from '../types';
import { createAbility } from '../cats/abilities';
import { COMBAT, PHYSICS } from '../config/GameConfig';
import { AudioManager } from '../systems/AudioManager';

export const PLAYER_TEXTURE = 'cat-body';

/**
 * The controllable cat. Wraps an Arcade sprite and re-equips itself whenever
 * the active cat changes (stats, color, ability all swap in setCat).
 */
export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  cat!: CatDefinition;
  private ability: Ability | null = null;
  private audio: AudioManager;

  facing: 1 | -1 = 1;
  private jumpsRemaining = 0;
  private abilityReadyAt = 0;
  private attackReadyAt = 0;
  private invulnUntil = 0;
  private dashUntil = 0;
  private dashVelX = 0;
  private slamActive = false;
  private slamRadius = 0;
  private specialHeld = false;
  health = 9;

  constructor(
    private readonly world: GameWorld,
    x: number,
    y: number,
  ) {
    this.audio = new AudioManager(world);
    this.sprite = world.physics.add.sprite(x, y, PLAYER_TEXTURE);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setCollideWorldBounds(true);
    this.body.setMaxVelocity(99999, PHYSICS.maxFallSpeed);
    this.body.setDragX(PHYSICS.dragX);
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  get stats(): CatStats {
    return this.cat.stats;
  }

  /** Swap in a new cat: color, stats, and ability. Preserves position/velocity
   *  so switching mid-jump feels seamless. */
  setCat(def: CatDefinition): void {
    this.cat = def;
    this.ability = createAbility(def.ability);
    this.sprite.setTint(def.bodyColor);
    // Reset transient ability state on swap.
    this.dashUntil = 0;
    this.slamActive = false;
    this.audio.play(def.sounds.select);
  }

  setSpecialHeld(held: boolean): void {
    this.specialHeld = held;
  }

  isSpecialHeld(): boolean {
    return this.specialHeld;
  }

  // --- Intent, called by the scene from input ---

  moveIntent(dir: -1 | 0 | 1, now: number): void {
    if (now < this.dashUntil) {
      this.body.setVelocityX(this.dashVelX);
      return;
    }
    if (dir !== 0) {
      this.body.setVelocityX(dir * this.stats.speed);
      this.facing = dir;
      this.sprite.setFlipX(dir < 0);
    }
  }

  jump(): void {
    const grounded = this.body.blocked.down;
    if (grounded) {
      this.jumpsRemaining = this.stats.extraJumps;
      this.launchJump();
    } else if (this.jumpsRemaining > 0) {
      this.jumpsRemaining--;
      this.launchJump();
    }
  }

  private launchJump(): void {
    this.body.setVelocityY(PHYSICS.jumpSign * this.stats.jumpVelocity);
    this.audio.play(this.cat.sounds.jump);
  }

  attack(now: number): void {
    if (now < this.attackReadyAt) return;
    this.attackReadyAt = now + COMBAT.attackCooldownMs;
    const reach = this.stats.attackReach;
    const cx = this.sprite.x + this.facing * (reach * 0.5);
    this.world.damageEnemiesInRadius(cx, this.sprite.y, reach * 0.55, 1);
    this.flashAttack(cx);
    this.audio.play(this.cat.sounds.attack);
  }

  useAbility(now: number): void {
    if (!this.ability) return;
    if (now < this.abilityReadyAt) return;
    const fired = this.ability.activate({ player: this, world: this.world, facing: this.facing });
    if (fired) {
      this.abilityReadyAt = now + this.ability.cooldownMs;
      this.audio.play(this.cat.sounds.ability);
    }
  }

  // --- Ability callbacks ---

  beginDash(durationMs: number, velX: number): void {
    this.dashUntil = this.world.time.now + durationMs;
    this.dashVelX = velX;
  }

  beginSlam(radius: number): void {
    this.slamActive = true;
    this.slamRadius = radius;
  }

  // --- Per-frame ---

  update(now: number, deltaMs: number): void {
    // Reset double-jumps + resolve a pending slam on landing.
    if (this.body.blocked.down) {
      if (this.slamActive) {
        this.world.damageEnemiesInRadius(this.sprite.x, this.sprite.y + 16, this.slamRadius, 2);
        this.world.shatterBreakablesInRadius(this.sprite.x, this.sprite.y + 16, this.slamRadius);
        this.world.cameras.main.shake(120, 0.008);
        this.slamActive = false;
      }
    }
    this.ability?.update?.({ player: this, world: this.world, facing: this.facing }, deltaMs);
    if (this.sprite.tintTopLeft !== this.cat.bodyColor && now > this.invulnUntil) {
      this.sprite.setTint(this.cat.bodyColor);
      this.sprite.setAlpha(1);
    }
  }

  takeDamage(now: number): boolean {
    if (now < this.invulnUntil) return false;
    this.health -= 1;
    this.invulnUntil = now + COMBAT.playerInvulnMs;
    this.sprite.setTint(0xffffff);
    this.sprite.setAlpha(0.6);
    this.audio.play(this.cat.sounds.hurt);
    return true;
  }

  bounceOffEnemy(): void {
    this.body.setVelocityY(-COMBAT.stompBounce);
  }

  private flashAttack(cx: number): void {
    const arc = this.world.add.circle(cx, this.sprite.y, this.stats.attackReach * 0.5, 0xffffff, 0.25);
    this.world.tweens.add({
      targets: arc,
      alpha: 0,
      duration: COMBAT.attackDurationMs,
      onComplete: () => arc.destroy(),
    });
  }
}
