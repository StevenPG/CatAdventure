import type { Ability, AbilityContext, AbilityId } from '../../types';

/** Quick horizontal burst in the facing direction, with brief i-frames feel
 *  via a velocity spike. */
export class DashAbility implements Ability {
  readonly id: AbilityId = 'dash';
  readonly cooldownMs = 700;
  private readonly dashSpeed = 720;
  private readonly dashDurationMs = 160;

  activate(ctx: AbilityContext): boolean {
    const body = ctx.player.body;
    body.setVelocityX(this.dashSpeed * ctx.facing);
    // Slight upward nudge so a grounded dash skims instead of sticking.
    if (body.blocked.down) body.setVelocityY(-120);
    ctx.player.beginDash(this.dashDurationMs, this.dashSpeed * ctx.facing);
    return true;
  }
}
