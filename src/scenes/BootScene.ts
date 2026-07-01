import Phaser from 'phaser';
import { SaveManager } from '../systems/SaveManager';
import { validateLevels } from '../systems/validateLevels';

/** Minimal boot: apply persisted settings, then hand off to the preloader. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.sound.mute = SaveManager.get().muted;
    if (import.meta.env.DEV) validateLevels();
    this.scene.start('Preload');
  }
}
