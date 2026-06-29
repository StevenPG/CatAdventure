import Phaser from 'phaser';
import { COLORS } from '../config/GameConfig';

export const ENEMY_TEXTURE = 'enemy-body';

/** Simple patrolling enemy. Walks back and forth across a patrol span,
 *  flips at edges/walls. Defeated by stomp, attack, projectile, or slam. */
export class Enemy {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  hp = 1;
  private readonly originX: number;
  private readonly patrolRange: number;
  private dir: 1 | -1 = 1;
  private readonly speed = 70;

  constructor(scene: Phaser.Scene, x: number, y: number, patrol = 80) {
    this.originX = x;
    this.patrolRange = patrol;
    this.sprite = scene.physics.add.sprite(x, y, ENEMY_TEXTURE);
    this.sprite.setTint(COLORS.enemy);
    this.sprite.setCollideWorldBounds(true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setBounceX(0);
    this.sprite.setData('ref', this);
  }

  update(): void {
    if (!this.sprite.active) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    // Flip at patrol bounds or when bumping a wall.
    if (this.sprite.x > this.originX + this.patrolRange || body.blocked.right) this.dir = -1;
    else if (this.sprite.x < this.originX - this.patrolRange || body.blocked.left) this.dir = 1;
    body.setVelocityX(this.dir * this.speed);
    this.sprite.setFlipX(this.dir < 0);
  }

  /** Returns true if the enemy died from this hit. */
  hurt(damage = 1): boolean {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die(): void {
    const scene = this.sprite.scene;
    const puff = scene.add.circle(this.sprite.x, this.sprite.y, 18, COLORS.enemy, 0.6);
    scene.tweens.add({ targets: puff, alpha: 0, scale: 1.8, duration: 220, onComplete: () => puff.destroy() });
    this.sprite.destroy();
  }
}
