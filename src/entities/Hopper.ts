import Phaser from 'phaser';
import { TUNING } from '../config/GameConfig';
import type { EnemyLike } from '../types';

/** An enemy that travels in springy hops along its patrol span. Same combat
 *  rules as any ground enemy (stomp/swipe/shoot/slam). */
export class Hopper implements EnemyLike {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  hp = 1;
  private readonly originX: number;
  private readonly patrolRange: number;
  private dir: 1 | -1 = 1;
  private nextHopAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, patrol = 80) {
    const cfg = TUNING.enemyKinds.hopper;
    this.originX = x;
    this.patrolRange = patrol;
    this.sprite = scene.physics.add.sprite(x, y, 'enemy');
    this.sprite.setTint(cfg.tint);
    this.sprite.setScale(cfg.scale);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setData('ref', this);
    if (scene.anims.exists('enemy-idle')) this.sprite.anims.play('enemy-idle');
  }

  update(): void {
    if (!this.sprite.active) return;
    const cfg = TUNING.enemyKinds.hopper;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const now = this.sprite.scene.time.now;

    // Bounce off walls mid-hop.
    if (body.blocked.left) this.dir = 1;
    else if (body.blocked.right) this.dir = -1;

    if (!body.blocked.down) return; // airborne — keep sailing
    body.setVelocityX(0);

    if (now >= this.nextHopAt) {
      // Turn around at the patrol bounds before leaping.
      if (this.sprite.x > this.originX + this.patrolRange) this.dir = -1;
      else if (this.sprite.x < this.originX - this.patrolRange) this.dir = 1;
      body.setVelocity(this.dir * cfg.hopVx, -cfg.hopVy);
      this.sprite.setFlipX(this.dir < 0);
      this.nextHopAt = now + cfg.intervalMs;
    }
  }

  hurt(damage = 1): boolean {
    this.hp -= damage;
    if (this.hp <= 0) {
      const scene = this.sprite.scene;
      const puff = scene.add.circle(this.sprite.x, this.sprite.y, 18, TUNING.enemyKinds.hopper.tint, 0.6);
      scene.tweens.add({ targets: puff, alpha: 0, scale: 1.8, duration: 220, onComplete: () => puff.destroy() });
      this.sprite.destroy();
      return true;
    }
    return false;
  }
}
