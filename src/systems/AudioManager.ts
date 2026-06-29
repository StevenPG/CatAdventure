import type Phaser from 'phaser';

/**
 * Plays sound keys if (and only if) the audio asset has actually been loaded.
 * Until you supply real audio in PreloadScene, every call is a harmless no-op,
 * so cat sound hooks can be wired now and "light up" the moment files exist.
 */
export class AudioManager {
  constructor(private readonly scene: Phaser.Scene) {}

  play(key: string | undefined, config?: Phaser.Types.Sound.SoundConfig): void {
    if (!key) return;
    if (!this.scene.cache.audio.exists(key)) return; // no asset yet — stub
    this.scene.sound.play(key, config);
  }
}
