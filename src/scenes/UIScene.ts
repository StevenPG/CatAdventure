import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { CatEvents } from '../systems/CatManager';
import { getEffectSpec, type ScreenEffectSpec } from '../cats/effects';
import type { CatDefinition } from '../types';
import type { GameScene } from './GameScene';

const VIGNETTE_KEY = 'ui-vignette';

const CHIP_BG = 0x2b3040; // resting cat-bar slot
const CHIP_ACTIVE = 0xffcd75; // selected slot glow (gold)
const FACE = 30; // cat-face slot size (px)

interface FaceIcon {
  chip: Phaser.GameObjects.Image;
  face: Phaser.GameObjects.Image;
  cat: CatDefinition;
}

/**
 * Overlay scene that runs in parallel with GameScene. Renders the HUD (top-
 * left), the cat-switch roster of face icons (top-right panel, active one gold
 * + enlarged), a switch toast, and the per-cat screen effect (vignette / tint).
 * Reads state from GameScene via events so it stays decoupled from gameplay.
 */
export class UIScene extends Phaser.Scene {
  private game_!: GameScene;
  private faces: FaceIcon[] = [];
  private heartsText!: Phaser.GameObjects.Text;
  private treatsText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private helpPanel!: Phaser.GameObjects.Container;
  private helpPinned = false;

  // Screen effect layer.
  private vignette!: Phaser.GameObjects.Image;
  private tintRect!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('UI');
  }

  create(): void {
    this.game_ = this.scene.get('Game') as GameScene;

    this.buildScreenEffectLayer();
    this.buildHud();
    this.buildCatBar();
    this.buildToast();
    this.buildHelp();

    // React to cat switches.
    const onChange = (cat: CatDefinition, index: number) => this.onCatChanged(cat, index);
    this.game_.catManager.on(CatEvents.Changed, onChange);
    // Sync to current selection immediately.
    this.onCatChanged(this.game_.catManager.current, this.game_.catManager.currentIndex);

    // React to HUD updates.
    const onHud = (s: { health: number; maxHealth: number; collected: number; total: number }) =>
      this.updateHud(s);
    this.game_.events.on('hud', onHud);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game_.catManager.off(CatEvents.Changed, onChange);
      this.game_.events.off('hud', onHud);
    });
  }

  // --- HUD (top-left): health + treats ---

  private buildHud(): void {
    const style = {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    } as const;
    this.heartsText = this.add
      .text(16, 14, '', { ...style, color: '#ff7085' })
      .setScrollFactor(0)
      .setDepth(10)
      .setStroke('#14151f', 4);
    this.treatsText = this.add
      .text(16, 44, '', { ...style, fontSize: '18px', color: '#ffcd75' })
      .setScrollFactor(0)
      .setDepth(10)
      .setStroke('#14151f', 4);
  }

  private updateHud(s: { health: number; maxHealth: number; collected: number; total: number }): void {
    const filled = '♥'.repeat(Math.max(0, s.health));
    const empty = '♡'.repeat(Math.max(0, s.maxHealth - s.health));
    this.heartsText.setText(`${filled}${empty}`);
    this.treatsText.setText(`★ ${s.collected} / ${s.total}`);
  }

  // --- Cat roster (top-right): a grid of tinted cat-face icons ---

  private buildCatBar(): void {
    const roster = this.game_.catManager.roster;
    const cols = 7;
    const rows = Math.ceil(roster.length / cols);
    const gap = 6;
    const cell = FACE + gap;
    const pad = 10;
    const gridW = cols * cell - gap;
    const gridH = rows * cell - gap;
    const nameH = 20;
    const panelW = gridW + pad * 2;
    const panelH = pad + gridH + 6 + nameH + 6;
    const margin = 12;
    const px = GAME_WIDTH - margin - panelW;
    const py = margin;

    this.add
      .graphics()
      .fillStyle(0x14151f, 0.55)
      .fillRoundedRect(px, py, panelW, panelH, 10)
      .setScrollFactor(0)
      .setDepth(9);

    const gx = px + pad + FACE / 2;
    const gy = py + pad + FACE / 2;
    roster.forEach((cat, i) => {
      const x = gx + (i % cols) * cell;
      const y = gy + Math.floor(i / cols) * cell;
      const chip = this.add
        .image(x, y, 'ui-chip')
        .setDisplaySize(FACE, FACE)
        .setTint(CHIP_BG)
        .setScrollFactor(0)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });
      chip.on('pointerdown', () => this.game_.catManager.selectById(cat.id));
      const face = this.add
        .image(x, y, 'cat-face')
        .setDisplaySize(FACE * 0.82, FACE * 0.82)
        .setTint(cat.faceColor)
        .setScrollFactor(0)
        .setDepth(11);
      this.faces.push({ chip, face, cat });
    });

    this.nameText = this.add
      .text(px + panelW / 2, py + pad + gridH + 6, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#ffcd75',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(11);
  }

  private buildToast(): void {
    this.toast = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.8, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: GAME_WIDTH * 0.7 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20)
      .setStroke('#14151f', 5)
      .setAlpha(0);
  }

  private onCatChanged(cat: CatDefinition, index: number): void {
    this.faces.forEach((f, i) => {
      const active = i === index;
      f.chip.setTint(active ? CHIP_ACTIVE : CHIP_BG);
      f.chip.setScale(active ? 1.12 : 1);
      f.face.setScale(active ? 1.12 : 1);
    });
    this.nameText.setText(cat.name);
    this.showToast(cat);
    this.applyScreenEffect(getEffectSpec(cat.effect));
  }

  private showToast(cat: CatDefinition): void {
    this.toast.setText(`${cat.name}\n${cat.description}`);
    this.tweens.killTweensOf(this.toast);
    this.toast.setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1400, duration: 600 });
  }

  // --- Controls help (always available, bottom-left) ---

  private buildHelp(): void {
    const lines = [
      'Move       ← →  /  A D',
      'Jump       ↑ / W / Space',
      'Attack     J',
      'Special    K   (hold to glide / hover)',
      'Switch cat Tab / Shift+Tab · or click a face',
      'Pause      Esc / P',
    ];
    const panelW = 320;
    const panelH = 176;
    const px = 16;
    const py = GAME_HEIGHT - 56 - panelH;

    const panel = this.add.graphics().fillStyle(0x14151f, 0.9).fillRoundedRect(px, py, panelW, panelH, 12);
    panel.lineStyle(2, 0x3b5dc9, 1).strokeRoundedRect(px, py, panelW, panelH, 12);
    const heading = this.add.text(px + 16, py + 12, 'Controls', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#ffcd75',
      fontStyle: 'bold',
    });
    const body = this.add.text(px + 16, py + 44, lines.join('\n'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      color: '#e6ebf5',
      lineSpacing: 6,
    });
    this.helpPanel = this.add.container(0, 0, [panel, heading, body]).setScrollFactor(0).setDepth(30).setVisible(false);

    // Always-visible "?" chip that reveals the panel on hover (and toggles it
    // pinned on click, for touch).
    const cx = 36;
    const cy = GAME_HEIGHT - 30;
    const chip = this.add
      .image(cx, cy, 'ui-chip')
      .setDisplaySize(34, 34)
      .setTint(0x3b5dc9)
      .setScrollFactor(0)
      .setDepth(31)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, cy, '?', { fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(32);

    chip.on('pointerover', () => this.helpPanel.setVisible(true));
    chip.on('pointerout', () => {
      if (!this.helpPinned) this.helpPanel.setVisible(false);
    });
    chip.on('pointerdown', () => {
      this.helpPinned = !this.helpPinned;
      this.helpPanel.setVisible(this.helpPinned);
    });
  }

  // --- Screen effect layer ---

  private buildScreenEffectLayer(): void {
    this.ensureVignetteTexture();
    this.tintRect = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(7);
    this.vignette = this.add
      .image(0, 0, VIGNETTE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(8)
      .setAlpha(0);
  }

  private ensureVignetteTexture(): void {
    if (this.textures.exists(VIGNETTE_KEY)) return;
    // Full-strength black radial vignette; we scale its alpha per-effect.
    const tex = this.textures.createCanvas(VIGNETTE_KEY, GAME_WIDTH, GAME_HEIGHT);
    if (!tex) return;
    const ctx = tex.getContext();
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const inner = Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.2;
    const outer = Math.hypot(cx, cy);
    const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    tex.refresh();
  }

  private applyScreenEffect(spec: ScreenEffectSpec): void {
    // Vignette strength maps to alpha; tighter radius => push the image scale so
    // the clear center shrinks (approximation that reads well for tunnel vision).
    this.vignette.setAlpha(spec.vignetteStrength);
    const scale = Phaser.Math.Clamp(1 / Math.max(0.2, spec.vignetteRadius), 1, 2.2);
    this.vignette.setDisplaySize(GAME_WIDTH * scale, GAME_HEIGHT * scale);
    this.vignette.setPosition((GAME_WIDTH - GAME_WIDTH * scale) / 2, (GAME_HEIGHT - GAME_HEIGHT * scale) / 2);

    if (spec.tint !== undefined && spec.tintAlpha > 0) {
      this.tintRect.setFillStyle(spec.tint, spec.tintAlpha);
    } else {
      this.tintRect.setFillStyle(0xffffff, 0);
    }
  }
}
