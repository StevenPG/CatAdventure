import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** A springy diagonal leap from the ground. Enemies caught mid-arc are bowled
 *  over (same contact-damage window as a dash-strike, but the leap arcs with
 *  gravity instead of skimming flat). */
export class PounceAbility implements Ability {
  readonly id: AbilityId = 'pounce';
  readonly cooldownMs = TUNING.abilities.pounce.cooldownMs;

  activate(ctx: AbilityContext): boolean {
    const body = ctx.player.body;
    // A crouch-and-leap — only from the ground (jumps cover the air).
    if (!body.blocked.down) return false;
    const cfg = TUNING.abilities.pounce;
    body.setVelocity(cfg.speedX * ctx.facing, -cfg.speedY);
    ctx.player.beginDash(cfg.durationMs, cfg.speedX * ctx.facing, cfg.damage);
    // Dust kicked off the launch spot, thrown back against the leap.
    ctx.world.emitBurst(ctx.player.sprite.x, body.bottom, {
      color: TUNING.fx.dustColor,
      count: 8,
      speed: 150,
      lifeMs: 320,
      gravityY: 600,
      angle: ctx.facing > 0 ? { min: 160, max: 260 } : { min: -80, max: 20 },
    });
    return true;
  }
}
