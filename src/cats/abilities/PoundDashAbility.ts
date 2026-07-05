import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** Context-sensitive heavy special: a major ground-pound when airborne, or a
 *  short hop-dash when on the ground. Bitty's signature. */
export class PoundDashAbility implements Ability {
  readonly id: AbilityId = 'pound-dash';
  readonly cooldownMs = TUNING.abilities.poundDash.cooldownMs;

  activate(ctx: AbilityContext): boolean {
    const cfg = TUNING.abilities.poundDash;
    const body = ctx.player.body;
    if (body.blocked.down) {
      // Short ground dash.
      body.setVelocityX(cfg.dashSpeed * ctx.facing);
      body.setVelocityY(-cfg.dashGroundLiftY);
      ctx.player.beginDash(cfg.dashDurationMs, cfg.dashSpeed * ctx.facing);
      ctx.player.kickDust(ctx.facing);
    } else {
      // Major ground-pound.
      body.setVelocityY(cfg.slamSpeed);
      body.setVelocityX(0);
      ctx.player.beginSlam(cfg.impactRadius, cfg.slamDamage, cfg.slamShake);
    }
    return true;
  }
}
