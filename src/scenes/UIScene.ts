import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { CatEvents } from '../systems/CatManager';
import { getEffectSpec, type ScreenEffectSpec } from '../cats/effects';
import type { CatDefinition } from '../types';
import type { GameScene } from './GameScene';

const VIGNETTE_KEY = 'ui-vignette';

interface FaceIcon {
  circle: Phaser.GameObjects.Arc;
  cat: CatDefinition;
}

/**
 * Overlay scene that runs in parallel with GameScene. Renders the HUD, the
 * cat-switch bar (all 13 faces, active one enlarged + ringed), and the
 * per-cat screen effect (vignette / tint). Reads state from GameScene via
 * events so it stays decoupled from gameplay logic.
 */
export class UIScene extends Phaser.Scene {
  private game_!: GameScene;
  private faces: FaceIcon[] = [];
  private activeRing!: Phaser.GameObjects.Arc;
  private nameText!: Phaser.GameObjects.Text;
  private abilityText!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;

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

    // React to cat switches.
    const onChange = (cat: CatDefinition, index: number) => this.onCatChanged(cat, index);
    this.game_.catManager.on(CatEvents.Changed, onChange);
    // Sync to current selection immediately.
    this.onCatChanged(this.game_.catManager.current, this.game_.catManager.currentIndex);

    // React to HUD updates.
    const onHud = (s: { health: number; collected: number; total: number }) => this.updateHud(s);
    this.game_.events.on('hud', onHud);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game_.catManager.off(CatEvents.Changed, onChange);
      this.game_.events.off('hud', onHud);
    });
  }

  // --- HUD ---

  private buildHud(): void {
    this.hudText = this.add
      .text(16, 14, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(10);
  }

  private updateHud(s: { health: number; collected: number; total: number }): void {
    const hearts = '♥'.repeat(Math.max(0, s.health));
    this.hudText.setText(`${hearts}    ★ ${s.collected}/${s.total}`);
  }

  // --- Cat bar ---

  private buildCatBar(): void {
    const roster = this.game_.catManager.roster;
    const size = 26;
    const gap = 8;
    const totalW = roster.length * size + (roster.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2 + size / 2;
    const y = GAME_HEIGHT - 34;

    this.add
      .rectangle(GAME_WIDTH / 2, y, totalW + 28, size + 22, 0x000000, 0.35)
      .setScrollFactor(0)
      .setDepth(9);

    this.activeRing = this.add
      .circle(0, y, size * 0.85, 0xffffff, 0)
      .setStrokeStyle(3, 0xffffff)
      .setScrollFactor(0)
      .setDepth(11);

    roster.forEach((cat, i) => {
      const x = startX + i * (size + gap);
      const circle = this.add
        .circle(x, y, size / 2, cat.faceColor, 1)
        .setStrokeStyle(2, 0x1a1c2c)
        .setScrollFactor(0)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });
      circle.on('pointerdown', () => this.game_.catManager.selectById(cat.id));
      this.faces.push({ circle, cat });
    });

    this.nameText = this.add
      .text(GAME_WIDTH / 2, y - 34, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);

    this.abilityText = this.add
      .text(GAME_WIDTH / 2, y - 16, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#c0cbdc',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);
  }

  private onCatChanged(cat: CatDefinition, index: number): void {
    const face = this.faces[index];
    if (face) {
      this.activeRing.setPosition(face.circle.x, face.circle.y);
      this.faces.forEach((f, i) => f.circle.setScale(i === index ? 1.35 : 1));
    }
    this.nameText.setText(cat.name);
    this.abilityText.setText(cat.description);
    this.applyScreenEffect(getEffectSpec(cat.effect));
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
