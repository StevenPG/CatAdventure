import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** Hold the special key in the air to hover (gentle lift), drawing from a fuel
 *  meter that refills when grounded. Release or run out and gravity resumes. */
export class HoverAbility implements Ability {
  readonly id: AbilityId = 'hover';
  readonly cooldownMs = 0;
  private fuelMs = TUNING.abilities.hover.fuelMs;
  private nextPuffAt = 0;

  activate(): boolean {
    return false; // held, not pressed — handled in update
  }

  update(ctx: AbilityContext, deltaMs: number): void {
    const body = ctx.player.body;
    if (body.blocked.down) {
      this.fuelMs = TUNING.abilities.hover.fuelMs; // refill on the ground
      return;
    }
    if (ctx.player.isSpecialHeld() && this.fuelMs > 0) {
      body.setVelocityY(TUNING.abilities.hover.liftVelocityY);
      this.fuelMs -= deltaMs;
      // Soft down-draft puffs under the paws while hovering.
      const now = ctx.world.time.now;
      if (now >= this.nextPuffAt) {
        this.nextPuffAt = now + 90;
        ctx.world.emitBurst(ctx.player.sprite.x, body.bottom, {
          color: 0xdfe8ff,
          count: 2,
          speed: 70,
          lifeMs: 260,
          scale: 0.6,
          angle: { min: 60, max: 120 },
        });
      }
    }
  }

  gauge(): number {
    return Math.max(0, this.fuelMs / TUNING.abilities.hover.fuelMs);
  }
}
