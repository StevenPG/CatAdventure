import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { LEVELS } from '../data/levels';
import { SaveManager } from '../systems/SaveManager';

/** Grid of level cards. Locked levels are dimmed; completed show a check and
 *  collectible count. Click or press 1..9 to play. */
export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    const save = SaveManager.get();
    this.cameras.main.setBackgroundColor('#1a1c2c');

    this.add
      .text(GAME_WIDTH / 2, 64, 'CAT ADVENTURE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '52px',
        color: '#ffcd75',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 112, 'A love letter to my cats', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#94b0c2',
      })
      .setOrigin(0.5);

    const cardW = 240;
    const cardH = 150;
    const gap = 32;
    const perRow = 3;
    const startX = (GAME_WIDTH - (perRow * cardW + (perRow - 1) * gap)) / 2 + cardW / 2;
    const startY = 220;

    LEVELS.forEach((level, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap);
      const unlocked = i <= save.unlockedLevel;
      const stats = save.statsFor(level.id);

      const card = this.add.container(x, y);
      const bg = this.add
        .rectangle(0, 0, cardW, cardH, unlocked ? 0x3b5dc9 : 0x29366f, 1)
        .setStrokeStyle(3, unlocked ? 0x73eff7 : 0x566c86);
      const title = this.add
        .text(0, -36, level.name, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '24px',
          color: unlocked ? '#ffffff' : '#73849c',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      const sub = this.add
        .text(
          0,
          8,
          unlocked
            ? `${stats.completed ? '✓ Cleared' : 'Play'}   ${stats.collected}/${level.collectibles.length} treats`
            : '🔒 Locked',
          {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '16px',
            color: unlocked ? '#c0cbdc' : '#73849c',
          },
        )
        .setOrigin(0.5);
      card.add([bg, title, sub]);

      if (unlocked) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => bg.setFillStyle(0x4a6de0));
        bg.on('pointerout', () => bg.setFillStyle(0x3b5dc9));
        bg.on('pointerdown', () => this.startLevel(i));
      }
    });

    // Number keys 1..9 launch the matching unlocked level.
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const n = Number.parseInt(e.key, 10);
      if (Number.isNaN(n)) return;
      const index = n - 1;
      if (index >= 0 && index < LEVELS.length && index <= save.unlockedLevel) {
        this.startLevel(index);
      }
    });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'Move: ← → / A D   Jump: ↑ / W / Space   Attack: J   Special: K   Switch cat: Tab   Pause: Esc / P', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#73849c',
      })
      .setOrigin(0.5);
  }

  private startLevel(index: number): void {
    this.scene.start('Game', { levelIndex: index });
  }
}
