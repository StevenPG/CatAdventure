import Phaser from 'phaser';
import { PLAYER_TEXTURE } from '../entities/Player';
import { ENEMY_TEXTURE } from '../entities/Enemy';
import { COLLECTIBLE_TEXTURE } from '../entities/Collectible';

/**
 * Generates placeholder textures procedurally so the game runs with ZERO binary
 * assets. All shapes are drawn white (facial features in black) so they tint
 * cleanly per-cat. When real sprite sheets arrive, load them here under the
 * same texture keys and delete the matching generator.
 *
 * Audio is intentionally not loaded — AudioManager no-ops on missing keys, so
 * sound hooks are already wired and will light up when you add files here.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // --- Real assets would be loaded here, e.g.:
    // this.load.spritesheet('cat-pounce', 'assets/cats/pounce.png', { frameWidth: 48, frameHeight: 48 });
    // this.load.audio('sfx-jump', 'assets/sfx/jump.wav');
  }

  create(): void {
    this.makeCatTexture();
    this.makeEnemyTexture();
    this.makeCollectibleTexture();
    this.makeTileTexture();
    this.makeProjectileTexture();
    this.scene.start('LevelSelect');
  }

  /** A simple cat silhouette: rounded body, two ears, dark eyes. */
  private makeCatTexture(): void {
    const w = 44;
    const h = 48;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    // ears
    g.fillTriangle(8, 18, 18, 2, 20, 20);
    g.fillTriangle(36, 18, 26, 2, 24, 20);
    // body
    g.fillRoundedRect(4, 14, 36, 32, 10);
    // eyes (stay dark through tint)
    g.fillStyle(0x1a1c2c, 1);
    g.fillCircle(16, 28, 3.2);
    g.fillCircle(28, 28, 3.2);
    // nose
    g.fillTriangle(20, 33, 24, 33, 22, 36);
    g.generateTexture(PLAYER_TEXTURE, w, h);
    g.destroy();
  }

  /** An angry little blob enemy. */
  private makeEnemyTexture(): void {
    const s = 36;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(2, 8, 32, 26, 8);
    // spiky top
    g.fillTriangle(6, 8, 12, 0, 18, 8);
    g.fillTriangle(18, 8, 24, 0, 30, 8);
    // angry eyes
    g.fillStyle(0x1a1c2c, 1);
    g.fillTriangle(9, 18, 17, 16, 9, 24);
    g.fillTriangle(27, 18, 19, 16, 27, 24);
    g.generateTexture(ENEMY_TEXTURE, s, s);
    g.destroy();
  }

  /** A four-point treat/star. */
  private makeCollectibleTexture(): void {
    const s = 22;
    const c = s / 2;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(c, 0, c - 5, c, c + 5, c);
    g.fillTriangle(c, s, c - 5, c, c + 5, c);
    g.fillTriangle(0, c, c, c - 5, c, c + 5);
    g.fillTriangle(s, c, c, c - 5, c, c + 5);
    g.fillCircle(c, c, 4);
    g.generateTexture(COLLECTIBLE_TEXTURE, s, s);
    g.destroy();
  }

  /** A 16x16 white tile, scaled per-platform and tinted in GameScene. */
  private makeTileTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 16, 16);
    g.generateTexture('tile', 16, 16);
    g.destroy();
  }

  private makeProjectileTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 7);
    g.generateTexture('projectile', 16, 16);
    g.destroy();
  }
}
