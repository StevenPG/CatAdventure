import Phaser from 'phaser';
import { COLORS, TUNING } from '../config/GameConfig';
import type { EnemyLike, FlyingEnemyDef } from '../types';

export const FLYER_TEXTURE = 'enemy';

/**
 * A gravity-free enemy that drifts along a sine path around its origin. Shares
 * the enemy spritesheet (tinted differently) and the same combat hooks as the
 * ground enemy — it can be stomped, swiped, shot, or slammed.
 */
export class FlyingEnemy implements EnemyLike {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  hp = 1;
  private readonly ox: number;
  private readonly oy: number;
  private readonly rangeX: number;
  private readonly rangeY: number;
  private readonly omega: number;

  constructor(scene: Phaser.Scene, def: FlyingEnemyDef) {
    this.ox = def.x;
    this.oy = def.y;
    this.rangeX = def.rangeX ?? TUNING.flyingEnemy.rangeX;
    this.rangeY = def.rangeY ?? TUNING.flyingEnemy.rangeY;
    const speed = def.speed ?? TUNING.flyingEnemy.speed;
    // Angular speed so the fastest point of the path ≈ `speed` px/s.
    this.omega = speed / Math.max(8, this.rangeX || this.rangeY);

    this.sprite = scene.physics.add.sprite(def.x, def.y, FLYER_TEXTURE);
    this.sprite.setTint(COLORS.flyer);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.sprite.setData('ref', this);
    if (scene.anims.exists('enemy-walk')) this.sprite.anims.play('enemy-walk');
  }

  update(): void {
    if (!this.sprite.active) return;
    const t = this.sprite.scene.time.now / 1000;
    const prevX = this.sprite.x;
    this.sprite.x = this.ox + Math.sin(t * this.omega) * this.rangeX;
    this.sprite.y = this.oy + Math.sin(t * this.omega * 1.3 + 1) * this.rangeY;
    if (Math.abs(this.sprite.x - prevX) > 0.2) this.sprite.setFlipX(this.sprite.x < prevX);
  }

  hurt(damage = 1): boolean {
    this.hp -= damage;
    if (this.hp <= 0) {
      const puff = this.sprite.scene.add.circle(this.sprite.x, this.sprite.y, 18, COLORS.flyer, 0.6);
      this.sprite.scene.tweens.add({ targets: puff, alpha: 0, scale: 1.8, duration: 220, onComplete: () => puff.destroy() });
      this.sprite.destroy();
      return true;
    }
    return false;
  }
}
