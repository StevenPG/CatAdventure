import type { Ability, AbilityContext, AbilityId } from '../../types';

/** Hold the special key in the air to fall slowly (glide). Implemented as a
 *  per-frame update that clamps downward velocity while the key is held. */
export class AirGlideAbility implements Ability {
  readonly id: AbilityId = 'air-glide';
  readonly cooldownMs = 0;
  private readonly glideFallSpeed = 90;

  activate(): boolean {
    // Glide is continuous (handled in update); the press itself does nothing.
    return false;
  }

  update(ctx: AbilityContext): void {
    const body = ctx.player.body;
    if (!body.blocked.down && ctx.player.isSpecialHeld() && body.velocity.y > this.glideFallSpeed) {
      body.setVelocityY(this.glideFallSpeed);
    }
  }
}
