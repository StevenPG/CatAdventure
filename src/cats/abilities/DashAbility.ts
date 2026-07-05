import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** Quick horizontal burst in the facing direction. */
export class DashAbility implements Ability {
  readonly id: AbilityId = 'dash';
  readonly cooldownMs = TUNING.abilities.dash.cooldownMs;

  activate(ctx: AbilityContext): boolean {
    const cfg = TUNING.abilities.dash;
    const body = ctx.player.body;
    body.setVelocityX(cfg.speed * ctx.facing);
    // Slight upward nudge so a grounded dash skims instead of sticking.
    if (body.blocked.down) body.setVelocityY(-cfg.groundLiftY);
    ctx.player.beginDash(cfg.durationMs, cfg.speed * ctx.facing);
    return true;
  }
}
