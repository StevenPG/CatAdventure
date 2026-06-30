import Phaser from 'phaser';
import { COLORS, TUNING } from '../config/GameConfig';
import type { MovingPlatformDef } from '../types';

/**
 * A platform that travels between two points and ping-pongs. Built from a
 * Rectangle (so its Arcade body matches its size exactly, no texture scaling).
 * The scene carries the player while they ride it (see GameScene.update).
 */
export class MovingPlatform {
  readonly rect: Phaser.GameObjects.Rectangle;
  private readonly highlight: Phaser.GameObjects.Rectangle;
  private readonly speed: number;
  private readonly a: { x: number; y: number };
  private readonly b: { x: number; y: number };
  private target: { x: number; y: number };

  constructor(scene: Phaser.Scene, def: MovingPlatformDef) {
    this.speed = def.speed ?? TUNING.movingPlatform.speed;
    // Endpoints as centre points.
    this.a = { x: def.x + def.width / 2, y: def.y + def.height / 2 };
    this.b = { x: def.toX + def.width / 2, y: def.toY + def.height / 2 };
    this.target = this.b;

    this.rect = scene.add.rectangle(this.a.x, this.a.y, def.width, def.height, COLORS.movingPlatform);
    scene.physics.add.existing(this.rect);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // A thin top-edge highlight that rides along.
    this.highlight = scene.add.rectangle(this.a.x, this.a.y - def.height / 2 + 2, def.width, 4, COLORS.movingPlatformTop);
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.rect.body as Phaser.Physics.Arcade.Body;
  }

  update(): void {
    const dx = this.target.x - this.rect.x;
    const dy = this.target.y - this.rect.y;
    if (Math.hypot(dx, dy) < 4) {
      this.target = this.target === this.b ? this.a : this.b;
    }
    const nx = this.target.x - this.rect.x;
    const ny = this.target.y - this.rect.y;
    const d = Math.hypot(nx, ny) || 1;
    this.body.setVelocity((nx / d) * this.speed, (ny / d) * this.speed);
    // Keep the highlight glued to the top of the platform.
    this.highlight.setPosition(this.rect.x, this.rect.y - this.rect.height / 2 + 2);
  }
}
