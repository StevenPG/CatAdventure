import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { LEVELS } from '../data/levels';
import { SaveManager } from '../systems/SaveManager';

/** Grid of level cards (fits all levels on screen). Locked levels are dimmed;
 *  unlocked ones — including already-cleared levels — are clickable to (re)play.
 *  Also hosts the progress-reset button. */
export class LevelSelectScene extends Phaser.Scene {
  private resetConfirming = false;

  constructor() {
    super('LevelSelect');
  }

  create(): void {
    this.resetConfirming = false;
    const save = SaveManager.get();
    this.cameras.main.setBackgroundColor('#1a1c2c');

    this.add
      .text(GAME_WIDTH / 2, 44, 'CAT ADVENTURE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '46px',
        color: '#ffcd75',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 82, 'A love letter to my cats', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#94b0c2',
      })
      .setOrigin(0.5);

    // Compact grid sized to fit every level within the 960x540 view.
    const perRow = 5;
    const cardW = 168;
    const cardH = 92;
    const gapX = 16;
    const gapY = 20;
    const startX = (GAME_WIDTH - (perRow * cardW + (perRow - 1) * gapX)) / 2 + cardW / 2;
    const startY = 168;

    LEVELS.forEach((level, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const unlocked = i <= save.unlockedLevel;
      const stats = save.statsFor(level.id);

      const card = this.add.container(x, y);
      const bg = this.add
        .rectangle(0, 0, cardW, cardH, unlocked ? 0x3b5dc9 : 0x29366f, 1)
        .setStrokeStyle(3, unlocked ? 0x73eff7 : 0x566c86);
      const num = this.add
        .text(-cardW / 2 + 10, -cardH / 2 + 6, `${i + 1}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          color: unlocked ? '#9fc0ff' : '#5f6f95',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0);
      const title = this.add
        .text(0, -12, level.name, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          color: unlocked ? '#ffffff' : '#73849c',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: cardW - 20 },
        })
        .setOrigin(0.5);
      const total = level.collectibles.length;
      const sub = this.add
        .text(
          0,
          26,
          unlocked
            ? (stats.completed ? `✓ Replay · ★ ${stats.collected}/${total}` : `Play · ★ 0/${total}`)
            : '🔒 Locked',
          {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            color: unlocked ? (stats.completed ? '#a7f070' : '#c0cbdc') : '#73849c',
          },
        )
        .setOrigin(0.5);
      card.add([bg, num, title, sub]);

      if (unlocked) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => bg.setFillStyle(0x4a6de0));
        bg.on('pointerout', () => bg.setFillStyle(0x3b5dc9));
        bg.on('pointerdown', () => this.startLevel(i));
      }
    });

    // Number keys 1..9 launch the matching unlocked level (mouse for the rest).
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const n = Number.parseInt(e.key, 10);
      if (Number.isNaN(n)) return;
      const index = n - 1;
      if (index >= 0 && index < LEVELS.length && index <= save.unlockedLevel) {
        this.startLevel(index);
      }
    });

    this.buildResetButton();

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'Move: ← → / A D   Jump: ↑ / W / Space   Attack: J   Special: K   Switch cat: Tab', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#73849c',
      })
      .setOrigin(0.5);
  }

  /** Two-step "Reset progress" so a stray click can't wipe everything. */
  private buildResetButton(): void {
    const x = GAME_WIDTH - 96;
    const y = GAME_HEIGHT - 22;
    const bg = this.add
      .rectangle(x, y, 168, 30, 0x5d275d, 1)
      .setStrokeStyle(2, 0xb13e53)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y, 'Reset progress', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffd0d8',
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x7a367a));
    bg.on('pointerout', () => bg.setFillStyle(0x5d275d));
    bg.on('pointerdown', () => {
      if (!this.resetConfirming) {
        this.resetConfirming = true;
        label.setText('Click again to confirm');
        bg.setFillStyle(0xb13e53);
        this.time.delayedCall(2600, () => {
          if (!this.scene.isActive()) return;
          this.resetConfirming = false;
          label.setText('Reset progress');
          bg.setFillStyle(0x5d275d);
        });
      } else {
        SaveManager.get().reset();
        this.scene.restart();
      }
    });
  }

  private startLevel(index: number): void {
    this.scene.start('Game', { levelIndex: index });
  }
}
