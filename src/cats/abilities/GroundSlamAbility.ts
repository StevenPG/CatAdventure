import type { Ability, AbilityContext, AbilityId } from '../../types';

/** Slam straight down. On landing, damages nearby enemies and shatters
 *  breakable platforms (handled by GameScene via the slam flag). */
export class GroundSlamAbility implements Ability {
  readonly id: AbilityId = 'ground-slam';
  readonly cooldownMs = 600;
  private readonly slamSpeed = 1400;
  private readonly impactRadius = 90;

  activate(ctx: AbilityContext): boolean {
    const body = ctx.player.body;
    // Only meaningful in the air.
    if (body.blocked.down) return false;
    body.setVelocityY(this.slamSpeed);
    body.setVelocityX(0);
    ctx.player.beginSlam(this.impactRadius);
    return true;
  }
}
