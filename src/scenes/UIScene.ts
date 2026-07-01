import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/GameConfig';
import { CatEvents } from '../systems/CatManager';
import { SaveManager } from '../systems/SaveManager';
import { getEffectSpec, type ScreenEffectSpec } from '../cats/effects';
import type { CatDefinition, TouchState } from '../types';
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
  private abilityBarBg!: Phaser.GameObjects.Image;
  private abilityBarFill!: Phaser.GameObjects.Image;
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
    this.buildTouchControls();

    // React to cat switches.
    const onChange = (cat: CatDefinition, index: number) => this.onCatChanged(cat, index);
    this.game_.catManager.on(CatEvents.Changed, onChange);
    // Sync to current selection immediately.
    this.onCatChanged(this.game_.catManager.current, this.game_.catManager.currentIndex);

    // React to HUD updates.
    const onHud = (s: { health: number; maxHealth: number; collected: number; total: number; ability: number | null }) =>
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
    // Ability gauge (hover fuel / cooldown readiness) under the treats.
    this.abilityBarBg = this.add
      .image(16, 74, 'ui-chip')
      .setOrigin(0, 0.5)
      .setDisplaySize(96, 12)
      .setTint(0x14151f)
      .setAlpha(0.8)
      .setScrollFactor(0)
      .setDepth(10);
    this.abilityBarFill = this.add
      .image(18, 74, 'ui-chip')
      .setOrigin(0, 0.5)
      .setDisplaySize(92, 8)
      .setScrollFactor(0)
      .setDepth(11);
  }

  private updateHud(s: { health: number; maxHealth: number; collected: number; total: number; ability: number | null }): void {
    const filled = '♥'.repeat(Math.max(0, s.health));
    const empty = '♡'.repeat(Math.max(0, s.maxHealth - s.health));
    this.heartsText.setText(`${filled}${empty}`);
    this.treatsText.setText(`★ ${s.collected} / ${s.total}`);

    // Ability gauge: hover fuel or cooldown readiness. Hidden when meaningless.
    if (s.ability === null) {
      this.abilityBarBg.setVisible(false);
      this.abilityBarFill.setVisible(false);
    } else {
      this.abilityBarBg.setVisible(true);
      this.abilityBarFill.setVisible(true).setDisplaySize(Math.max(1, 96 * s.ability), 8);
      this.abilityBarFill.setTint(s.ability >= 1 ? 0xa7f070 : 0x73eff7);
    }
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
      chip.on('pointerdown', () => {
        if (this.game_.sys.isPaused()) return; // no switching under the pause overlay
        this.game_.catManager.selectById(cat.id);
      });
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

  // --- Bottom-left chip row: help, mute, fullscreen ---

  /** A small labelled square button. */
  private chipButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): { chip: Phaser.GameObjects.Image; text: Phaser.GameObjects.Text } {
    const chip = this.add
      .image(x, y, 'ui-chip')
      .setDisplaySize(34, 34)
      .setTint(0x3b5dc9)
      .setScrollFactor(0)
      .setDepth(31)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, { fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(32);
    chip.on('pointerover', () => chip.setTint(0x4a6de0));
    chip.on('pointerout', () => chip.setTint(0x3b5dc9));
    chip.on('pointerdown', onClick);
    return { chip, text };
  }

  private buildHelp(): void {
    const lines = [
      'Move        ← →  /  A D',
      'Jump        ↑ / W / Space (tap = short hop)',
      'Attack      J',
      'Special     K   (hold to glide / hover)',
      'Switch cat  Tab / Shift+Tab · or click a face',
      'Pause       Esc / P     Fullscreen  F',
    ];
    const panelW = 340;
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

    const cy = GAME_HEIGHT - 30;

    // "?" reveals the controls panel on hover; click pins it (for touch).
    const help = this.chipButton(36, cy, '?', () => {
      this.helpPinned = !this.helpPinned;
      this.helpPanel.setVisible(this.helpPinned);
    });
    help.chip.on('pointerover', () => this.helpPanel.setVisible(true));
    help.chip.on('pointerout', () => {
      if (!this.helpPinned) this.helpPanel.setVisible(false);
    });

    // Mute toggle (persisted).
    const mute = this.chipButton(78, cy, this.sound.mute ? '🔇' : '🔊', () => {
      const muted = !this.sound.mute;
      this.sound.mute = muted;
      SaveManager.get().setMuted(muted);
      mute.text.setText(muted ? '🔇' : '🔊');
    });

    // Fullscreen toggle (also on F).
    this.chipButton(120, cy, '⛶', () => this.toggleFullscreen());
    this.input.keyboard?.on('keydown-F', () => this.toggleFullscreen());
  }

  private toggleFullscreen(): void {
    if (this.scale.isFullscreen) this.scale.stopFullscreen();
    else this.scale.startFullscreen();
  }

  // --- Touch controls (only shown on touch devices) ---

  private buildTouchControls(): void {
    if (!this.sys.game.device.input.touch) return;
    this.input.addPointer(2); // allow move + jump + special simultaneously

    const ts: TouchState = {
      left: false,
      right: false,
      specialHeld: false,
      jumpQueued: false,
      jumpReleased: false,
      attackQueued: false,
      specialQueued: false,
    };
    this.registry.set('touchState', ts);

    /** A translucent circular touch button. `onHeld` tracks held state. */
    const button = (x: number, y: number, r: number, label: string, onDown: () => void, onUp?: () => void) => {
      const zone = this.add
        .circle(x, y, r, 0xffffff, 0.14)
        .setStrokeStyle(2, 0xffffff, 0.35)
        .setScrollFactor(0)
        .setDepth(40)
        .setInteractive({ useHandCursor: false });
      this.add
        .text(x, y, label, { fontFamily: 'system-ui, sans-serif', fontSize: `${Math.round(r * 0.9)}px`, color: '#ffffff' })
        .setOrigin(0.5)
        .setAlpha(0.75)
        .setScrollFactor(0)
        .setDepth(41);
      zone.on('pointerdown', () => {
        zone.setFillStyle(0xffffff, 0.32);
        onDown();
      });
      const release = () => {
        zone.setFillStyle(0xffffff, 0.14);
        onUp?.();
      };
      zone.on('pointerup', release);
      zone.on('pointerout', release);
      return zone;
    };

    // Movement (bottom-left, above the chip row).
    button(64, GAME_HEIGHT - 104, 34, '◀', () => (ts.left = true), () => (ts.left = false));
    button(148, GAME_HEIGHT - 104, 34, '▶', () => (ts.right = true), () => (ts.right = false));

    // Actions (bottom-right): jump, attack, special.
    button(GAME_WIDTH - 60, GAME_HEIGHT - 104, 36, '⤒', () => (ts.jumpQueued = true), () => (ts.jumpReleased = true));
    button(GAME_WIDTH - 148, GAME_HEIGHT - 84, 30, '✦', () => (ts.attackQueued = true));
    button(
      GAME_WIDTH - 226, GAME_HEIGHT - 64, 28, '★',
      () => {
        ts.specialQueued = true;
        ts.specialHeld = true;
      },
      () => (ts.specialHeld = false),
    );

    // Pause (top-centre, out of the way of HUD and roster).
    const pause = this.chipButton(GAME_WIDTH / 2, 30, '⏸', () => this.game_.requestPause());
    pause.chip.setAlpha(0.7);
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
