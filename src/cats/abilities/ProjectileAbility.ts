import type { Ability, AbilityContext, AbilityId } from '../../types';
import { TUNING } from '../../config/GameConfig';

/** Fires a projectile forward via the world. */
export class ProjectileAbility implements Ability {
  readonly id: AbilityId = 'projectile';
  readonly cooldownMs = TUNING.abilities.projectile.cooldownMs;

  activate(ctx: AbilityContext): boolean {
    const { x, y } = ctx.player.sprite;
    const offset = TUNING.abilities.projectile.spawnOffset;
    ctx.world.spawnProjectile(x + ctx.facing * offset, y, ctx.facing, ctx.player.stats.attackReach);
    return true;
  }
}
