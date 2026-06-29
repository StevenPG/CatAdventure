import Phaser from 'phaser';

/** Minimal boot: nothing to load yet, jump straight to asset generation. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.scene.start('Preload');
  }
}
