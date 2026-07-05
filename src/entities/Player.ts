import Phaser from 'phaser';
import type { Ability, CatDefinition, CatStats, GameWorld } from '../types';
import { createAbility } from '../cats/abilities';
import { TUNING } from '../config/GameConfig';
import { DEFAULT_CAT_ID } from '../data/cats';
import { AudioManager } from '../systems/AudioManager';

/** Per-cat spritesheet key convention: 'cat-<id>' (see config/assets.ts). */
export const catTextureKey = (id: string): string => `cat-${id}`;
/** Texture the sprite is created with before the first setCat swaps it in. */
export const PLAYER_TEXTURE = catTextureKey(DEFAULT_CAT_ID);

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
  private boostUntil = 0;
  private boostMultiplier = 1;
  private spinUntil = 0;
  private spinDurationMs = 0;
  private spinDir: 1 | -1 = 1;
  private nextTrailAt = 0;
  private specialHeld = false;
  /** True while riding a moving platform (counts as grounded for jump/anim). */
  private onPlatform = false;
  private lastGroundedAt = -Infinity;
  private jumpBufferedUntil = -Infinity;
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
    this.animPrefix = def.spriteSheet ?? catTextureKey(def.id);
    this.sprite.setTexture(this.animPrefix);
    // Preserve the feet position across a scale change. Keeping the sprite
    // CENTER fixed would sink a bigger cat's feet into the floor; the deep
    // penetration makes Arcade eject the body downward through the ground.
    const feetY = this.sprite.y + this.sprite.displayHeight / 2;
    this.sprite.setScale(def.scale ?? 1);
    this.resizeBody(def.scale ?? 1);
    this.sprite.y = feetY - this.sprite.displayHeight / 2;
    // Per-cat art carries its own color, so no runtime tint. Clear any leftover
    // hit-flash from the previous cat.
    this.sprite.clearTint();
    this.sprite.setAlpha(1);
    this.sprite.setAngle(0); // reset any quirk rotation from the previous cat
    // Switch the health buffer to the new cat's max. Clamp wounds so a switch
    // never heals you (wounds persist) nor instantly kills you (leaves >= 1).
    this.maxHealth = def.maxHealth ?? TUNING.player.maxHealth;
    this.wounds = Math.min(this.wounds, this.maxHealth - 1);
    // Reset transient ability state on swap.
    this.dashUntil = 0;
    this.slamActive = false;
    this.boostUntil = 0;
    this.spinUntil = 0;
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
      const boost = now < this.boostUntil ? this.boostMultiplier : 1;
      this.body.setVelocityX(dir * this.stats.speed * boost);
      this.facing = dir;
      this.sprite.setFlipX(dir < 0);
    }
  }

  /** Jump input. Ground jumps get coyote time (a grace window after walking
   *  off a ledge) and buffering (pressing just before landing still fires). */
  requestJump(now: number): void {
    if (this.grounded || now - this.lastGroundedAt <= TUNING.player.coyoteMs) {
      this.doGroundJump();
    } else if (this.jumpsRemaining > 0) {
      this.jumpsRemaining--;
      this.launchJump();
    } else {
      this.jumpBufferedUntil = now + TUNING.player.jumpBufferMs;
    }
  }

  /** Variable jump height: releasing the jump key while rising cuts the arc. */
  cutJump(): void {
    if (this.body.velocity.y < 0) {
      this.body.setVelocityY(this.body.velocity.y * TUNING.player.jumpCutMultiplier);
    }
  }

  private doGroundJump(): void {
    this.jumpsRemaining = this.stats.extraJumps;
    this.lastGroundedAt = -Infinity; // consume coyote so it can't double-fire
    this.jumpBufferedUntil = -Infinity;
    this.launchJump();
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

  /** 0..1 gauge for the HUD: an ability's own resource (hover fuel) when it
   *  has one, otherwise cooldown readiness. Null = nothing worth showing. */
  abilityGauge(now: number): number | null {
    if (!this.ability) return null;
    const own = this.ability.gauge?.();
    if (own !== undefined) return own;
    if (this.ability.cooldownMs <= 0) return null;
    const remaining = this.abilityReadyAt - now;
    return remaining <= 0 ? 1 : 1 - Math.min(1, remaining / this.ability.cooldownMs);
  }

  beginSlam(radius: number, damage: number, shake: number): void {
    this.slamActive = true;
    this.slamRadius = radius;
    this.slamDamage = damage;
    this.slamShake = shake;
  }

  /** Timed run-speed multiplier (zoomies). The afterimage trail draws while
   *  the boost is live. */
  beginSpeedBoost(durationMs: number, multiplier: number): void {
    this.boostUntil = this.world.time.now + durationMs;
    this.boostMultiplier = multiplier;
  }

  /** Spin the sprite for the given window (whirlwind). Purely visual — like
   *  the wobble quirk it only touches sprite.angle, which Arcade never writes,
   *  and it takes precedence over the quirk while active. */
  beginSpin(durationMs: number, dir: number): void {
    this.spinUntil = this.world.time.now + durationMs;
    this.spinDurationMs = durationMs;
    this.spinDir = dir < 0 ? -1 : 1;
  }

  /** Kick a puff of dust off the ground behind a dash/lunge in `facing`
   *  direction. Cosmetic; safe to call airborne (the puff just floats). */
  kickDust(facing: number): void {
    this.world.emitBurst(this.sprite.x - facing * 10, this.body.bottom, {
      color: TUNING.fx.dustColor,
      count: 6,
      speed: 130,
      lifeMs: 280,
      gravityY: 500,
      angle: facing > 0 ? { min: 160, max: 240 } : { min: -60, max: 20 },
    });
  }

  // --- Per-frame ---

  update(now: number, deltaMs: number): void {
    // Track grounded time (coyote) and fire a buffered jump on landing.
    if (this.grounded) {
      this.lastGroundedAt = now;
      if (now < this.jumpBufferedUntil) this.doGroundJump();
    }

    // Reset double-jumps + resolve a pending slam on landing.
    if (this.body.blocked.down && this.slamActive) {
      const ix = this.sprite.x;
      const iy = this.sprite.y + 16;
      this.world.damageEnemiesInRadius(ix, iy, this.slamRadius, this.slamDamage);
      this.world.shatterBreakablesInRadius(ix, iy, this.slamRadius);
      this.world.cameras.main.shake(120, this.slamShake);
      // Impact juice: a shockwave ring plus dust thrown up and outward.
      this.world.emitShockwave(ix, this.body.bottom, this.slamRadius);
      this.world.emitBurst(ix, this.body.bottom, {
        color: TUNING.fx.dustColor,
        count: 14,
        speed: 240,
        lifeMs: 420,
        gravityY: 800,
        angle: { min: 190, max: 350 },
      });
      this.slamActive = false;
    }
    this.ability?.update?.({ player: this, world: this.world, facing: this.facing }, deltaMs);
    this.updateTrail(now);

    // Clear the i-frame flash once it ends (per-cat art has no runtime tint).
    if (this.sprite.isTinted && now > this.invulnUntil) {
      this.sprite.clearTint();
      this.sprite.setAlpha(1);
    }

    this.updateAnimation(now);
    this.updateSpin(now);
    this.updateQuirk(now);
  }

  /** Whirl the sprite while a beginSpin window is live; snap upright after. */
  private updateSpin(now: number): void {
    if (this.spinUntil === 0) return;
    if (now >= this.spinUntil) {
      this.spinUntil = 0;
      this.sprite.setAngle(0);
      return;
    }
    const t = 1 - (this.spinUntil - now) / this.spinDurationMs;
    this.sprite.setAngle(t * 360 * TUNING.abilities.whirlwind.spins * this.spinDir);
  }

  /** Fading afterimage ghosts behind fast moves (dash, pounce, zoomies). */
  private updateTrail(now: number): void {
    if (now >= this.dashUntil && now >= this.boostUntil) return;
    if (now < this.nextTrailAt) return;
    const v = this.body.velocity;
    if (Math.abs(v.x) < 60 && Math.abs(v.y) < 60) return; // only when moving
    const cfg = TUNING.fx;
    this.nextTrailAt = now + cfg.trailIntervalMs;
    const ghost = this.world.add
      .image(this.sprite.x, this.sprite.y, this.sprite.texture.key, this.sprite.frame.name)
      .setFlipX(this.sprite.flipX)
      .setScale(this.sprite.scaleX, this.sprite.scaleY)
      .setAngle(this.sprite.angle)
      .setAlpha(cfg.trailAlpha)
      .setDepth(this.sprite.depth - 1);
    this.world.tweens.add({ targets: ghost, alpha: 0, duration: cfg.trailFadeMs, onComplete: () => ghost.destroy() });
  }

  /** Purely cosmetic per-frame flair. Only ever touches sprite.angle, which
   *  Arcade Physics never writes to — safe to set every frame with no fight
   *  against the body's position/velocity sync. */
  private updateQuirk(now: number): void {
    if (this.spinUntil > 0) return; // a whirlwind spin owns the angle
    if (this.cat.quirk !== 'wobble') return;
    const cfg = TUNING.quirks.wobble;
    const t = now / 1000;
    const angle = Math.sin(t * cfg.speed) * cfg.angleDeg + Math.sin(t * cfg.jitterSpeed + 1) * cfg.jitterDeg;
    this.sprite.setAngle(angle);
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
    // Guard on existence so one bad/missing asset can't throw inside the game
    // loop (which would silently break everything after Player.update).
    if (this.sprite.anims && this.world.anims.exists(key)) this.sprite.anims.play(key, ignoreIfPlaying);
  }

  takeDamage(now: number): boolean {
    if (now < this.invulnUntil) return false;
    this.wounds += 1;
    this.invulnUntil = now + TUNING.combat.playerInvulnMs;
    this.sprite.setTintFill(0xffffff); // solid white blink over the sprite art
    this.sprite.setAlpha(0.85);
    this.audio.play(this.cat.sounds.hurt ?? 'sfx-hurt');
    return true;
  }

  bounceOffEnemy(): void {
    this.body.setVelocityY(-TUNING.combat.stompBounce);
  }

  /** Refill to full and restore normal appearance (used on soft respawn). */
  resetHealth(): void {
    this.wounds = 0;
    this.sprite.clearTint();
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
