import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** Hold the special key in the air to fall slowly (glide). */
export class AirGlideAbility implements Ability {
  readonly id: AbilityId = 'air-glide';
  readonly cooldownMs = 0;

  activate(): boolean {
    // Glide is continuous (handled in update); the press itself does nothing.
    return false;
  }

  update(ctx: AbilityContext): void {
    const body = ctx.player.body;
    const fall = TUNING.abilities.airGlide.fallSpeed;
    if (!body.blocked.down && ctx.player.isSpecialHeld() && body.velocity.y > fall) {
      body.setVelocityY(fall);
    }
  }
}
