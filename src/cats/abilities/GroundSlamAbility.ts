import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** Slam straight down. On landing, damages nearby enemies and shatters
 *  breakable platforms (resolved by the Player on the next ground contact). */
export class GroundSlamAbility implements Ability {
  readonly id: AbilityId = 'ground-slam';
  readonly cooldownMs = TUNING.abilities.groundSlam.cooldownMs;

  activate(ctx: AbilityContext): boolean {
    const body = ctx.player.body;
    // Only meaningful in the air.
    if (body.blocked.down) return false;
    body.setVelocityY(TUNING.abilities.groundSlam.speed);
    body.setVelocityX(0);
    ctx.player.beginSlam(TUNING.abilities.groundSlam.impactRadius);
    return true;
  }
}
