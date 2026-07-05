import Phaser from 'phaser';
import { TUNING } from '../config/GameConfig';
import type { EnemyLike } from '../types';

type ChargerState = 'patrol' | 'telegraph' | 'charge' | 'cooldown';

/** A tougher enemy (2 HP) that patrols slowly, then telegraphs (shakes) and
 *  charges when the cat is roughly level with it. It happily charges off
 *  ledges. Stomp it twice, or hit it with heavy attacks. */
export class Charger implements EnemyLike {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  hp: number = TUNING.enemyKinds.charger.hp;
  private readonly originX: number;
  private readonly patrolRange: number;
  private dir: 1 | -1 = 1;
  private state: ChargerState = 'patrol';
  private stateUntil = 0;
  private chargeDir: 1 | -1 = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrol = 80,
    private readonly getTarget: () => { x: number; y: number },
  ) {
    const cfg = TUNING.enemyKinds.charger;
    this.originX = x;
    this.patrolRange = patrol;
    this.sprite = scene.physics.add.sprite(x, y, 'enemy');
    this.sprite.setTint(cfg.tint);
    this.sprite.setScale(cfg.scale);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setData('ref', this);
    if (scene.anims.exists('enemy-walk')) this.sprite.anims.play('enemy-walk');
  }

  update(): void {
    if (!this.sprite.active) return;
    const cfg = TUNING.enemyKinds.charger;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const now = this.sprite.scene.time.now;

    switch (this.state) {
      case 'patrol': {
        if (this.sprite.x > this.originX + this.patrolRange || body.blocked.right) this.dir = -1;
        else if (this.sprite.x < this.originX - this.patrolRange || body.blocked.left) this.dir = 1;
        body.setVelocityX(this.dir * cfg.patrolSpeed);
        this.sprite.setFlipX(this.dir < 0);

        const target = this.getTarget();
        const dx = target.x - this.sprite.x;
        if (Math.abs(dx) < cfg.range && Math.abs(target.y - this.sprite.y) < cfg.verticalTolerance) {
          this.state = 'telegraph';
          this.stateUntil = now + cfg.telegraphMs;
          this.chargeDir = dx < 0 ? -1 : 1;
          this.sprite.setFlipX(this.chargeDir < 0);
          body.setVelocityX(0);
        }
        break;
      }
      case 'telegraph': {
        // Angry shiver while winding up.
        this.sprite.setAngle(Math.sin(now / 18) * 6);
        if (now >= this.stateUntil) {
          this.sprite.setAngle(0);
          this.state = 'charge';
          this.stateUntil = now + cfg.chargeMaxMs;
        }
        break;
      }
      case 'charge': {
        body.setVelocityX(this.chargeDir * cfg.chargeSpeed);
        if (body.blocked.left || body.blocked.right || now >= this.stateUntil) {
          body.setVelocityX(0);
          this.state = 'cooldown';
          this.stateUntil = now + cfg.cooldownMs;
        }
        break;
      }
      case 'cooldown': {
        if (now >= this.stateUntil) this.state = 'patrol';
        break;
      }
    }
  }

  hurt(damage = 1): boolean {
    this.hp -= damage;
    if (this.hp <= 0) {
      const scene = this.sprite.scene;
      const puff = scene.add.circle(this.sprite.x, this.sprite.y, 22, TUNING.enemyKinds.charger.tint, 0.6);
      scene.tweens.add({ targets: puff, alpha: 0, scale: 1.8, duration: 220, onComplete: () => puff.destroy() });
      this.sprite.destroy();
      return true;
    }
    // Flinch feedback for surviving a hit.
    this.sprite.scene.tweens.add({ targets: this.sprite, alpha: { from: 0.4, to: 1 }, duration: 160 });
    return false;
  }
}
