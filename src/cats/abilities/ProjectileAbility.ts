import type { Ability, AbilityContext, AbilityId } from '../../types';

/** Fires a projectile forward via the world. */
export class ProjectileAbility implements Ability {
  readonly id: AbilityId = 'projectile';
  readonly cooldownMs = 450;

  activate(ctx: AbilityContext): boolean {
    const { x, y } = ctx.player.sprite;
    ctx.world.spawnProjectile(x + ctx.facing * 24, y, ctx.facing, ctx.player.stats.attackReach);
    return true;
  }
}
