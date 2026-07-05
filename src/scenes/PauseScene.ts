import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';

/**
 * Overlay shown when the game is paused. Launched on top of GameScene + UIScene
 * while GameScene is paused (its update + physics freeze). Resume returns to
 * play; menu quits to the level select.
 */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1c2c, 0.72).setOrigin(0, 0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 36, 'PAUSED', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '52px',
        color: '#ffcd75',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, 'Esc / P  —  resume       R  —  restart level       M  —  level select', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#c0cbdc',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', () => this.resumeGame());
    kb.on('keydown-P', () => this.resumeGame());
    kb.on('keydown-M', () => this.toMenu());
    kb.on('keydown-R', () => this.restartLevel());
  }

  private restartLevel(): void {
    const game = this.scene.get('Game') as import('./GameScene').GameScene;
    const levelIndex = game.levelIdx;
    this.scene.stop('UI');
    this.scene.stop('Game');
    this.scene.start('Game', { levelIndex }); // also stops this Pause scene
  }

  private resumeGame(): void {
    this.scene.resume('Game');
    this.scene.stop();
  }

  private toMenu(): void {
    this.scene.stop('Game');
    this.scene.stop('UI');
    this.scene.start('LevelSelect');
    this.scene.stop();
  }
}
