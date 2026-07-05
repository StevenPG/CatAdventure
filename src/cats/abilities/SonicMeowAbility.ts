import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** A meow so loud it bonks everything nearby: instant radial damage around the
 *  cat, sold with a double expanding ring, a spray of particles, and a screen
 *  shake. Works on the ground or in the air. */
export class SonicMeowAbility implements Ability {
  readonly id: AbilityId = 'sonic-meow';
  readonly cooldownMs = TUNING.abilities.sonicMeow.cooldownMs;

  activate(ctx: AbilityContext): boolean {
    const cfg = TUNING.abilities.sonicMeow;
    const { x, y } = ctx.player.sprite;
    ctx.world.damageEnemiesInRadius(x, y, cfg.radius, cfg.damage);
    ctx.world.emitShockwave(x, y, cfg.radius, 0xfff3b0);
    // A second, tighter ring a beat later reads as reverberation.
    ctx.world.time.delayedCall(90, () => ctx.world.emitShockwave(x, y, cfg.radius * 0.7, 0xfff3b0));
    ctx.world.emitBurst(x, y, { color: 0xfff3b0, count: 12, speed: 260, lifeMs: 320, scale: 0.9 });
    ctx.world.cameras.main.shake(120, cfg.shake);
    return true;
  }
}
