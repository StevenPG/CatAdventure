import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** A brief tornado spin: the sprite whirls (Player.beginSpin) while enemies in
 *  a ring around the cat take damage in ticks for the spin's duration. Swirl
 *  particles fly off each tick. */
export class WhirlwindAbility implements Ability {
  readonly id: AbilityId = 'whirlwind';
  readonly cooldownMs = TUNING.abilities.whirlwind.cooldownMs;
  private spinningUntil = 0;
  private nextTickAt = 0;

  activate(ctx: AbilityContext): boolean {
    const cfg = TUNING.abilities.whirlwind;
    const now = ctx.world.time.now;
    this.spinningUntil = now + cfg.durationMs;
    this.nextTickAt = now; // first damage tick lands immediately (in update)
    ctx.player.beginSpin(cfg.durationMs, ctx.facing);
    return true;
  }

  update(ctx: AbilityContext): void {
    const now = ctx.world.time.now;
    if (now >= this.spinningUntil || now < this.nextTickAt) return;
    const cfg = TUNING.abilities.whirlwind;
    this.nextTickAt = now + cfg.tickMs;
    const { x, y } = ctx.player.sprite;
    ctx.world.damageEnemiesInRadius(x, y, cfg.radius, cfg.damage);
    ctx.world.emitBurst(x, y, { color: 0xf5f2ea, count: 6, speed: 220, lifeMs: 260, scale: 0.8 });
  }
}
