import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** The 3am cat frenzy: a timed burst of raw run speed with an afterimage trail
 *  (the trail itself is drawn by Player while the boost is live). No damage,
 *  no i-frames — just outrunning your problems. */
export class ZoomiesAbility implements Ability {
  readonly id: AbilityId = 'zoomies';
  readonly cooldownMs = TUNING.abilities.zoomies.cooldownMs;

  activate(ctx: AbilityContext): boolean {
    const cfg = TUNING.abilities.zoomies;
    ctx.player.beginSpeedBoost(cfg.durationMs, cfg.speedMultiplier);
    // A pop of energy at takeoff.
    ctx.world.emitBurst(ctx.player.sprite.x, ctx.player.sprite.y, {
      count: 10,
      speed: 180,
      lifeMs: 260,
      scale: 0.8,
    });
    return true;
  }
}
