import type { Ability, AbilityId } from '../../types';
import { DashAbility } from './DashAbility';
import { GroundSlamAbility } from './GroundSlamAbility';
import { ProjectileAbility } from './ProjectileAbility';
import { AirGlideAbility } from './AirGlideAbility';

/**
 * Maps an AbilityId to a fresh Ability instance. Abilities are lightweight and
 * stateless-ish, so we build one per cat-equip. `none` returns null.
 */
export function createAbility(id: AbilityId): Ability | null {
  switch (id) {
    case 'dash':
      return new DashAbility();
    case 'ground-slam':
      return new GroundSlamAbility();
    case 'projectile':
      return new ProjectileAbility();
    case 'air-glide':
      return new AirGlideAbility();
    case 'none':
    default:
      return null;
  }
}
