import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** A short lunging dash that damages enemies caught in its path (a "dash
 *  attack"). The damage is applied by GameScene while the dash is active. */
export class DashStrikeAbility implements Ability {
  readonly id: AbilityId = 'dash-strike';
  readonly cooldownMs = TUNING.abilities.dashStrike.cooldownMs;

  activate(ctx: AbilityContext): boolean {
    const cfg = TUNING.abilities.dashStrike;
    const body = ctx.player.body;
    body.setVelocityX(cfg.speed * ctx.facing);
    if (body.blocked.down) body.setVelocityY(-cfg.groundLiftY);
    ctx.player.beginDash(cfg.durationMs, cfg.speed * ctx.facing, cfg.damage);
    ctx.player.kickDust(ctx.facing);
    return true;
  }
}
