import Phaser from 'phaser';
import { COLORS, TUNING } from '../config/GameConfig';
import type { HazardDef } from '../types';

const SPIKE = 16;

/**
 * A static damaging zone, drawn as a red band with a row of spike teeth. The
 * `zone` rectangle carries the static body used for the player overlap.
 */
export class Hazard {
  readonly zone: Phaser.GameObjects.Rectangle;
  readonly damage: number;

  constructor(scene: Phaser.Scene, def: HazardDef) {
    this.damage = def.damage ?? TUNING.hazards.damage;
    const cx = def.x + def.width / 2;
    const cy = def.y + def.height / 2;
    this.zone = scene.add.rectangle(cx, cy, def.width, def.height, COLORS.hazard, 0.85).setDepth(2);
    scene.physics.add.existing(this.zone, true); // static body sized to the rect

    // Decorative spike teeth across the top edge.
    const teeth = Math.max(1, Math.round(def.width / SPIKE));
    for (let i = 0; i < teeth; i++) {
      scene.add
        .image(def.x + i * SPIKE + SPIKE / 2, def.y, 'spike')
        .setOrigin(0.5, 1)
        .setTint(COLORS.hazardSpike)
        .setDepth(2);
    }
  }
}
