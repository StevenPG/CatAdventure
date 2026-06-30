import Phaser from 'phaser';
import type { Ability, CatDefinition, CatStats, GameWorld } from '../types';
import { createAbility } from '../cats/abilities';
import { TUNING } from '../config/GameConfig';
import { AudioManager } from '../systems/AudioManager';

/** Default placeholder spritesheet key (see config/assets.ts). */
export const PLAYER_TEXTURE = 'cat';

/**
 * The controllable cat. Wraps an Arcade sprite and re-equips itself whenever
 * the active cat changes (sprite sheet, color, stats, ability all swap in
 * setCat). Drives its own animation state machine each frame.
 */
export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  cat!: CatDefinition;
  private ability: Ability | null = null;
  private audio: AudioManager;

  facing: 1 | -1 = 1;
  private animPrefix = PLAYER_TEXTURE;
  private jumpsRemaining = 0;
  private abilityReadyAt = 0;
  private attackReadyAt = 0;
  private attackAnimUntil = 0;
  private invulnUntil = 0;
  private dashUntil = 0;
  private dashVelX = 0;
  private dashDamage = 0;
  private slamActive = false;
  private slamRadius = 0;
  private slamDamage = 0;
  private slamShake = 0;
  private specialHeld = false;
  /** True while riding a moving platform (counts as grounded for jump/anim). */
  private onPlatform = false;
  /** Current cat's max health (hearts). Set per-cat in setCat. */
  maxHealth: number = TUNING.player.maxHealth;
  /** Damage taken since the last respawn. Health is derived from this, so a
   *  cat switch changes the buffer without healing or instantly killing. */
  private wounds = 0;

  get health(): number {
    return Math.max(0, this.maxHealth - this.wounds);
  }

  constructor(
    private readonly world: GameWorld,
    x: number,
    y: number,
  ) {
    this.audio = new AudioManager(world);
    this.sprite = world.physics.add.sprite(x, y, PLAYER_TEXTURE);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setCollideWorldBounds(true);
    this.body.setMaxVelocity(99999, TUNING.physics.maxFallSpeed);
    this.body.setDragX(TUNING.physics.dragX);
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  get stats(): CatStats {
    return this.cat.stats;
  }

  /** Swap in a new cat: sprite sheet, color, stats, ability. Preserves
   *  position/velocity so switching mid-jump feels seamless. */
  setCat(def: CatDefinition): void {
    this.cat = def;
    this.ability = createAbility(def.ability);
    this.animPrefix = def.spriteSheet ?? PLAYER_TEXTURE;
    this.sprite.setTexture(this.animPrefix);
    // Preserve the feet position across a scale change. Keeping the sprite
    // CENTER fixed would sink a bigger cat's feet into the floor; the deep
    // penetration makes Arcade eject the body downward through the ground.
    const feetY = this.sprite.y + this.sprite.displayHeight / 2;
    this.sprite.setScale(def.scale ?? 1);
    this.resizeBody(def.scale ?? 1);
    this.sprite.y = feetY - this.sprite.displayHeight / 2;
    this.sprite.setTint(def.bodyColor);
    // Switch the health buffer to the new cat's max. Clamp wounds so a switch
    // never heals you (wounds persist) nor instantly kills you (leaves >= 1).
    this.maxHealth = def.maxHealth ?? TUNING.player.maxHealth;
    this.wounds = Math.min(this.wounds, this.maxHealth - 1);
    // Reset transient ability state on swap.
    this.dashUntil = 0;
    this.slamActive = false;
    this.playAnim('idle');
    this.audio.play(def.sounds.select ?? 'sfx-select');
  }

  /** Constant world-space collision box (px), centered at the sprite's feet.
   *  Kept the same for every cat regardless of visual scale: Arcade scales a
   *  body with the sprite, and rescaling a resting body can eject it through
   *  static floors. Counter-scaling the source size keeps the world hitbox
   *  fixed (and platforming forgiving). */
  private static readonly HITBOX = { w: 30, h: 42 };

  private resizeBody(scale: number): void {
    const fw = this.sprite.width;
    const fh = this.sprite.height;
    const bw = Player.HITBOX.w / scale;
    const bh = Player.HITBOX.h / scale;
    this.body.setSize(bw, bh);
    this.body.setOffset((fw - bw) / 2, fh - bh);
  }

  setSpecialHeld(held: boolean): void {
    this.specialHeld = held;
  }

  setOnPlatform(v: boolean): void {
    this.onPlatform = v;
  }

  private get grounded(): boolean {
    return this.body.blocked.down || this.onPlatform;
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
    if (this.grounded) {
      this.jumpsRemaining = this.stats.extraJumps;
      this.launchJump();
    } else if (this.jumpsRemaining > 0) {
      this.jumpsRemaining--;
      this.launchJump();
    }
  }

  private launchJump(): void {
    this.body.setVelocityY(TUNING.physics.jumpSign * this.stats.jumpVelocity);
    this.audio.play(this.cat.sounds.jump);
  }

  attack(now: number): void {
    if (now < this.attackReadyAt) return;
    this.attackReadyAt = now + TUNING.combat.attackCooldownMs;
    this.attackAnimUntil = now + TUNING.combat.attackDurationMs;
    this.playAnim('attack', false);
    const reach = this.stats.attackReach;
    const damage = this.stats.attackDamage ?? TUNING.combat.attackDamage;
    const cx = this.sprite.x + this.facing * (reach * 0.5);
    this.world.damageEnemiesInRadius(cx, this.sprite.y, reach * 0.55, damage);
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

  beginDash(durationMs: number, velX: number, damage = 0): void {
    this.dashUntil = this.world.time.now + durationMs;
    this.dashVelX = velX;
    this.dashDamage = damage;
  }

  /** Damage dealt by an in-progress dash-strike, or 0 if not currently
   *  dashing with damage. Read by GameScene on player↔enemy overlap. */
  get dashStrikeDamage(): number {
    return this.world.time.now < this.dashUntil ? this.dashDamage : 0;
  }

  beginSlam(radius: number, damage: number, shake: number): void {
    this.slamActive = true;
    this.slamRadius = radius;
    this.slamDamage = damage;
    this.slamShake = shake;
  }

  // --- Per-frame ---

  update(now: number, deltaMs: number): void {
    // Reset double-jumps + resolve a pending slam on landing.
    if (this.body.blocked.down && this.slamActive) {
      this.world.damageEnemiesInRadius(this.sprite.x, this.sprite.y + 16, this.slamRadius, this.slamDamage);
      this.world.shatterBreakablesInRadius(this.sprite.x, this.sprite.y + 16, this.slamRadius);
      this.world.cameras.main.shake(120, this.slamShake);
      this.slamActive = false;
    }
    this.ability?.update?.({ player: this, world: this.world, facing: this.facing }, deltaMs);

    // Restore normal tint once the i-frame flash ends.
    if (this.sprite.tintTopLeft !== this.cat.bodyColor && now > this.invulnUntil) {
      this.sprite.setTint(this.cat.bodyColor);
      this.sprite.setAlpha(1);
    }

    this.updateAnimation(now);
  }

  /** Pick the right animation from physics state. Attack holds briefly. */
  private updateAnimation(now: number): void {
    if (now < this.attackAnimUntil) return;
    const v = this.body.velocity;
    if (!this.grounded) {
      this.playAnim(v.y < 0 ? 'jump' : 'fall');
    } else if (Math.abs(v.x) > 12) {
      this.playAnim('run');
    } else {
      this.playAnim('idle');
    }
  }

  private playAnim(name: string, ignoreIfPlaying = true): void {
    const key = `${this.animPrefix}-${name}`;
    if (this.sprite.anims) this.sprite.anims.play(key, ignoreIfPlaying);
  }

  takeDamage(now: number): boolean {
    if (now < this.invulnUntil) return false;
    this.wounds += 1;
    this.invulnUntil = now + TUNING.combat.playerInvulnMs;
    this.sprite.setTint(0xffffff);
    this.sprite.setAlpha(0.6);
    this.audio.play(this.cat.sounds.hurt ?? 'sfx-hurt');
    return true;
  }

  bounceOffEnemy(): void {
    this.body.setVelocityY(-TUNING.combat.stompBounce);
  }

  /** Refill to full and restore normal appearance (used on soft respawn). */
  resetHealth(): void {
    this.wounds = 0;
    this.sprite.setTint(this.cat.bodyColor);
    this.sprite.setAlpha(1);
  }

  makeInvulnerable(ms: number): void {
    this.invulnUntil = this.world.time.now + ms;
  }

  private flashAttack(cx: number): void {
    const arc = this.world.add.circle(cx, this.sprite.y, this.stats.attackReach * 0.5, 0xffffff, 0.25);
    this.world.tweens.add({
      targets: arc,
      alpha: 0,
      duration: TUNING.combat.attackDurationMs,
      onComplete: () => arc.destroy(),
    });
  }
}
