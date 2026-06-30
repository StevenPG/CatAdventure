import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { BACKGROUND, CAT_ANIMS, ENEMY_ANIMS, SFX, SHEETS } from '../config/assets';
import { PlaceholderFactory } from '../systems/PlaceholderFactory';
import { CATS } from '../data/cats';

/**
 * Loads everything from the asset manifest. Each entry uses its real `src` file
 * if set, otherwise a generated placeholder. Animations are built in create()
 * once spritesheets are available.
 *
 * To add real art/audio: set `src` on the entry in config/assets.ts and drop
 * the file in `public/`. No code changes needed here.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // Spritesheets (cat, enemy) — real file or generated placeholder sheet.
    for (const [key, sheet] of Object.entries(SHEETS)) {
      const src = sheet.src ?? PlaceholderFactory.makeSheet(sheet.generator, sheet.frameWidth, sheet.frameHeight, sheet.frameCount);
      this.load.spritesheet(key, src, { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight });
    }

    // Sound effects — real file or synthesized placeholder tone.
    for (const [key, sfx] of Object.entries(SFX)) {
      const src = sfx.src ?? PlaceholderFactory.makeTone(sfx.tone);
      this.load.audio(key, src);
    }
  }

  create(): void {
    this.createCatAnimations();
    this.createEnemyAnimations();
    this.makeSimpleTextures();
    this.makeBackgroundTextures();
    this.scene.start('LevelSelect');
  }

  /** Build the standard animation set for every distinct cat spritesheet. */
  private createCatAnimations(): void {
    const keys = new Set(CATS.map((c) => c.spriteSheet ?? 'cat'));
    for (const key of keys) {
      for (const [name, def] of Object.entries(CAT_ANIMS)) {
        const animKey = `${key}-${name}`;
        if (this.anims.exists(animKey)) continue;
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(key, { frames: def.frames }),
          frameRate: def.frameRate,
          repeat: def.repeat,
        });
      }
    }
  }

  private createEnemyAnimations(): void {
    for (const [name, def] of Object.entries(ENEMY_ANIMS)) {
      const animKey = `enemy-${name}`;
      if (this.anims.exists(animKey)) continue;
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers('enemy', { frames: def.frames }),
        frameRate: def.frameRate,
        repeat: def.repeat,
      });
    }
  }

  /** Simple single shapes used directly (tinted in-scene). */
  private makeSimpleTextures(): void {
    // White tile for platforms.
    let g = this.add.graphics();
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 16, 16);
    g.generateTexture('tile', 16, 16);
    g.destroy();

    // Collectible treat (four-point star).
    g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    const s = 22;
    const c = s / 2;
    g.fillTriangle(c, 0, c - 5, c, c + 5, c);
    g.fillTriangle(c, s, c - 5, c, c + 5, c);
    g.fillTriangle(0, c, c, c - 5, c, c + 5);
    g.fillTriangle(s, c, c, c - 5, c, c + 5);
    g.fillCircle(c, c, 4);
    g.generateTexture('collectible', s, s);
    g.destroy();

    // Projectile.
    g = this.add.graphics();
    g.fillStyle(0xffffff, 1).fillCircle(8, 8, 7);
    g.generateTexture('projectile', 16, 16);
    g.destroy();

    // A single spike tooth (base at bottom), tiled across hazard zones.
    g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(0, 16, 8, 0, 16, 16);
    g.generateTexture('spike', 16, 16);
    g.destroy();
  }

  /** Sky gradient + tileable hill silhouettes for parallax. */
  private makeBackgroundTextures(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(BACKGROUND.skyTop, BACKGROUND.skyTop, BACKGROUND.skyBottom, BACKGROUND.skyBottom, 1);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    sky.generateTexture('bg-sky', GAME_WIDTH, GAME_HEIGHT);
    sky.destroy();

    for (const layer of BACKGROUND.layers) {
      const tileW = 512;
      const g = this.add.graphics();
      g.fillStyle(layer.color, 1);
      // a few overlapping hills, seamless-ish across the tile width
      const baseY = layer.height;
      g.fillRect(0, baseY - 30, tileW, 60);
      for (let x = -64; x <= tileW + 64; x += 160) {
        g.fillCircle(x, baseY - 30, 90);
        g.fillCircle(x + 80, baseY - 30, 60);
      }
      g.generateTexture(layer.key, tileW, layer.height);
      g.destroy();
    }
  }
}
