import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** Passive: the cat always drifts down gently while airborne — no key needed.
 *  (Wilson floats like a leaf.) */
export class FeatherFallAbility implements Ability {
  readonly id: AbilityId = 'feather-fall';
  readonly cooldownMs = 0;

  activate(): boolean {
    return false; // passive — nothing happens on press
  }

  update(ctx: AbilityContext): void {
    const body = ctx.player.body;
    const fall = TUNING.abilities.featherFall.fallSpeed;
    if (!body.blocked.down && body.velocity.y > fall) {
      body.setVelocityY(fall);
    }
  }
}
