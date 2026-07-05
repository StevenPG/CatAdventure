import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { PauseScene } from './scenes/PauseScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // per-scene gravity is set in GameScene
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, LevelSelectScene, GameScene, UIScene, PauseScene],
};

const game = new Phaser.Game(config);
// Dev-only handle for the smoke test / browser console. Absent in production.
if (import.meta.env.DEV) (globalThis as unknown as { __game: Phaser.Game }).__game = game;
