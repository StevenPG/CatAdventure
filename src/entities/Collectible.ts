import Phaser from 'phaser';
import { COLORS } from '../config/GameConfig';

export const COLLECTIBLE_TEXTURE = 'collectible';

/** A collectible treat. Bobs gently; counts toward level completion. */
export class Collectible {
  readonly sprite: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, COLLECTIBLE_TEXTURE);
    this.sprite.setTint(COLORS.collectible);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    scene.tweens.add({
      targets: this.sprite,
      y: y - 8,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  collect(): void {
    const scene = this.sprite.scene;
    const flash = scene.add.circle(this.sprite.x, this.sprite.y, 12, COLORS.collectible, 0.8);
    scene.tweens.add({ targets: flash, alpha: 0, scale: 2.4, duration: 260, onComplete: () => flash.destroy() });
    this.sprite.destroy();
  }
}
