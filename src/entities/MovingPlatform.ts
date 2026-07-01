import Phaser from 'phaser';
import { COLORS, TUNING } from '../config/GameConfig';
import type { MovingPlatformDef } from '../types';

/**
 * A platform that travels between two points and ping-pongs. Moved manually by
 * frame delta-time (not physics velocity) so the exact per-frame displacement
 * is known and the rider can be carried by precisely that amount — keeping cat
 * and platform in perfect lockstep at any frame/physics rate. It has no physics
 * body: it's a one-way rider resolved geometrically in GameScene.
 */
export class MovingPlatform {
  readonly rect: Phaser.GameObjects.Rectangle;
  private readonly highlight: Phaser.GameObjects.Rectangle;
  private readonly w: number;
  private readonly h: number;
  private readonly speed: number;
  private readonly a: { x: number; y: number };
  private readonly b: { x: number; y: number };
  private target: { x: number; y: number };

  /** Displacement applied on the last update — used to carry the rider. */
  dx = 0;
  dy = 0;

  constructor(scene: Phaser.Scene, def: MovingPlatformDef) {
    this.w = def.width;
    this.h = def.height;
    this.speed = def.speed ?? TUNING.movingPlatform.speed;
    // Endpoints as centre points.
    this.a = { x: def.x + def.width / 2, y: def.y + def.height / 2 };
    this.b = { x: def.toX + def.width / 2, y: def.toY + def.height / 2 };
    this.target = this.b;

    this.rect = scene.add.rectangle(this.a.x, this.a.y, def.width, def.height, COLORS.movingPlatform);
    this.highlight = scene.add.rectangle(this.a.x, this.a.y - def.height / 2 + 2, def.width, 4, COLORS.movingPlatformTop);
  }

  get top(): number {
    return this.rect.y - this.h / 2;
  }
  get left(): number {
    return this.rect.x - this.w / 2;
  }
  get right(): number {
    return this.rect.x + this.w / 2;
  }

  update(deltaMs: number): void {
    const step = this.speed * (deltaMs / 1000);
    const ox = this.rect.x;
    const oy = this.rect.y;
    const toX = this.target.x - ox;
    const toY = this.target.y - oy;
    const dist = Math.hypot(toX, toY);

    let nx: number;
    let ny: number;
    if (dist <= step || dist === 0) {
      // Reached (or overshoot) the endpoint — snap and reverse.
      nx = this.target.x;
      ny = this.target.y;
      this.target = this.target === this.b ? this.a : this.b;
    } else {
      nx = ox + (toX / dist) * step;
      ny = oy + (toY / dist) * step;
    }

    this.dx = nx - ox;
    this.dy = ny - oy;
    this.rect.setPosition(nx, ny);
    this.highlight.setPosition(nx, ny - this.h / 2 + 2);
  }
}
