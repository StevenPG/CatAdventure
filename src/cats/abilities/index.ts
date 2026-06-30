import type { Ability, AbilityId } from '../../types';
import { DashAbility } from './DashAbility';
import { DashStrikeAbility } from './DashStrikeAbility';
import { GroundSlamAbility } from './GroundSlamAbility';
import { PoundDashAbility } from './PoundDashAbility';
import { ProjectileAbility } from './ProjectileAbility';
import { AirGlideAbility } from './AirGlideAbility';
import { FeatherFallAbility } from './FeatherFallAbility';

/**
 * Maps an AbilityId to a fresh Ability instance. Abilities are lightweight and
 * stateless-ish, so we build one per cat-equip. `none` returns null.
 */
export function createAbility(id: AbilityId): Ability | null {
  switch (id) {
    case 'dash':
      return new DashAbility();
    case 'dash-strike':
      return new DashStrikeAbility();
    case 'ground-slam':
      return new GroundSlamAbility();
    case 'pound-dash':
      return new PoundDashAbility();
    case 'projectile':
      return new ProjectileAbility();
    case 'air-glide':
      return new AirGlideAbility();
    case 'feather-fall':
      return new FeatherFallAbility();
    case 'none':
    default:
      return null;
  }
}
