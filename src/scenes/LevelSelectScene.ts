import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { LEVELS } from '../data/levels';
import { SaveManager } from '../systems/SaveManager';

const PER_ROW = 5;
const CARD_W = 168;
const CARD_H = 92;
const GAP_X = 16;
const GAP_Y = 18;
const ROW_H = CARD_H + GAP_Y;
const GRID_TOP = 178; // y of the first row's centre (at scroll 0)
const VIEW_TOP = 128; // masked viewport top
const VIEW_BOTTOM = 496; // masked viewport bottom

/**
 * Grid of level cards. Scrolls vertically (wheel or drag) so it holds any
 * number of levels. Unlocked levels — including cleared ones — are clickable to
 * (re)play; each played level has a per-level reset. A full-wipe button and both
 * confirm dialogs live here too.
 */
export class LevelSelectScene extends Phaser.Scene {
  private grid!: Phaser.GameObjects.Container;
  private scrollMin = 0; // most-negative container.y
  private modalOpen = false;
  private dragActive = false;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private dragMoved = false;

  constructor() {
    super('LevelSelect');
  }

  create(): void {
    this.modalOpen = false;
    this.dragActive = false;
    this.dragMoved = false;
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

    this.buildGrid(save);
    this.setupScroll();
    this.setupKeys(save);
    this.buildFooter();
  }

  // --- Scrollable grid of cards ---

  private buildGrid(save: SaveManager): void {
    const startX = (GAME_WIDTH - (PER_ROW * CARD_W + (PER_ROW - 1) * GAP_X)) / 2 + CARD_W / 2;
    this.grid = this.add.container(0, 0);

    LEVELS.forEach((level, i) => {
      const col = i % PER_ROW;
      const row = Math.floor(i / PER_ROW);
      const x = startX + col * (CARD_W + GAP_X);
      const y = GRID_TOP + row * ROW_H;
      const unlocked = i <= save.unlockedLevel;
      const stats = save.statsFor(level.id);
      const total = level.collectibles.length;

      const card = this.add.container(x, y);
      const bg = this.add
        .rectangle(0, 0, CARD_W, CARD_H, unlocked ? 0x3b5dc9 : 0x29366f, 1)
        .setStrokeStyle(3, unlocked ? 0x73eff7 : 0x566c86);
      const num = this.add
        .text(-CARD_W / 2 + 10, -CARD_H / 2 + 6, `${i + 1}`, {
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
          wordWrap: { width: CARD_W - 20 },
        })
        .setOrigin(0.5);
      const sub = this.add
        .text(
          0,
          26,
          unlocked
            ? stats.completed
              ? `✓ Replay · ★ ${stats.collected}/${total}`
              : `Play · ★ 0/${total}`
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
        // Activate on release, and only if the pointer wasn't dragging (scroll).
        bg.on('pointerup', () => {
          if (!this.dragMoved && !this.modalOpen) this.startLevel(i);
        });

        // Per-level reset — only when there's progress to clear.
        if (stats.completed || stats.collected > 0) {
          const rx = CARD_W / 2 - 16;
          const ry = -CARD_H / 2 + 16;
          const btn = this.add
            .image(rx, ry, 'ui-chip')
            .setDisplaySize(24, 24)
            .setTint(0x5d275d)
            .setInteractive({ useHandCursor: true });
          const icon = this.add
            .text(rx, ry, '↺', { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#ffd0d8' })
            .setOrigin(0.5);
          btn.on('pointerover', () => btn.setTint(0xb13e53));
          btn.on('pointerout', () => btn.setTint(0x5d275d));
          btn.on('pointerup', () => {
            if (this.dragMoved || this.modalOpen) return;
            this.showConfirm(`Reset "${level.name}"?\nIts treats and clear status will be wiped.`, () => {
              SaveManager.get().resetLevel(level.id);
              this.scene.restart();
            });
          });
          card.add([btn, icon]);
        }
      }
      this.grid.add(card);
    });

    // Clip the grid to a viewport so scrolled cards don't cover the title/footer.
    const maskShape = this.make.graphics({}, false);
    maskShape.fillRect(0, VIEW_TOP, GAME_WIDTH, VIEW_BOTTOM - VIEW_TOP);
    this.grid.setMask(maskShape.createGeometryMask());

    const rows = Math.ceil(LEVELS.length / PER_ROW);
    const contentBottom = GRID_TOP + (rows - 1) * ROW_H + CARD_H / 2;
    this.scrollMin = Math.min(0, VIEW_BOTTOM - contentBottom - 8);
  }

  // --- Scrolling (wheel + drag) ---

  private setupScroll(): void {
    if (this.scrollMin >= 0) return; // everything fits; no scrolling needed

    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (this.modalOpen) return;
      this.grid.y = Phaser.Math.Clamp(this.grid.y - dy * 0.5, this.scrollMin, 0);
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.modalOpen) return;
      this.dragActive = true;
      this.dragMoved = false;
      this.dragStartY = p.y;
      this.dragStartScroll = this.grid.y;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragActive || !p.isDown || this.modalOpen) return;
      const dy = p.y - this.dragStartY;
      if (Math.abs(dy) > 6) this.dragMoved = true;
      this.grid.y = Phaser.Math.Clamp(this.dragStartScroll + dy, this.scrollMin, 0);
    });
    this.input.on('pointerup', () => {
      this.dragActive = false;
      // Clear the drag flag next tick so card pointerup handlers can read it.
      this.time.delayedCall(0, () => (this.dragMoved = false));
    });

    // A subtle "scroll for more" hint.
    this.add
      .text(GAME_WIDTH / 2, VIEW_BOTTOM - 6, '▾ scroll for more ▾', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#5f6f95',
      })
      .setOrigin(0.5, 1)
      .setDepth(5);
  }

  private setupKeys(save: SaveManager): void {
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (this.modalOpen) return;
      const n = Number.parseInt(e.key, 10);
      if (Number.isNaN(n)) return;
      const index = n - 1;
      if (index >= 0 && index < LEVELS.length && index <= save.unlockedLevel) {
        this.startLevel(index);
      }
    });
  }

  // --- Footer: controls hint + full reset ---

  private buildFooter(): void {
    this.add
      .text(GAME_WIDTH / 2 - 60, GAME_HEIGHT - 20, 'Move: ← → / A D   Jump: ↑ / W / Space   Switch cat: Tab', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#73849c',
      })
      .setOrigin(0.5);

    const x = GAME_WIDTH - 96;
    const y = GAME_HEIGHT - 22;
    const bg = this.add
      .rectangle(x, y, 168, 30, 0x5d275d, 1)
      .setStrokeStyle(2, 0xb13e53)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, 'Reset all progress', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffd0d8',
      })
      .setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0x7a367a));
    bg.on('pointerout', () => bg.setFillStyle(0x5d275d));
    bg.on('pointerup', () => {
      if (this.modalOpen) return;
      this.showConfirm('Reset ALL progress?\nEvery level and treat will be wiped. This cannot be undone.', () => {
        SaveManager.get().reset();
        this.scene.restart();
      });
    });
  }

  // --- Reusable "Are you sure?" modal ---

  private showConfirm(message: string, onYes: () => void): void {
    this.modalOpen = true;
    const depth = 100;
    const overlay = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setInteractive(); // swallow clicks to the grid below

    const panelW = 460;
    const panelH = 200;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const panel = this.add
      .graphics()
      .fillStyle(0x1f2233, 1)
      .fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 14)
      .lineStyle(2, 0x3b5dc9, 1)
      .strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 14)
      .setDepth(depth + 1);
    const text = this.add
      .text(cx, cy - 36, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelW - 48 },
      })
      .setOrigin(0.5)
      .setDepth(depth + 2);

    const parts: Phaser.GameObjects.GameObject[] = [overlay, panel, text];
    const close = () => {
      parts.forEach((p) => p.destroy());
      this.modalOpen = false;
    };
    const button = (bx: number, label: string, fill: number, hover: number, onClick: () => void) => {
      const b = this.add
        .rectangle(bx, cy + 52, 180, 44, fill, 1)
        .setStrokeStyle(2, hover)
        .setDepth(depth + 2)
        .setInteractive({ useHandCursor: true });
      const t = this.add
        .text(bx, cy + 52, label, { fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5)
        .setDepth(depth + 3);
      b.on('pointerover', () => b.setFillStyle(hover));
      b.on('pointerout', () => b.setFillStyle(fill));
      b.on('pointerup', onClick);
      parts.push(b, t);
    };
    button(cx - 100, 'Cancel', 0x3a3f4a, 0x566c86, close);
    button(cx + 100, 'Yes, reset', 0x8b2e3f, 0xb13e53, () => {
      close();
      onYes();
    });
  }

  private startLevel(index: number): void {
    this.scene.start('Game', { levelIndex: index });
  }
}
