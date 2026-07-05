import type Phaser from 'phaser';
import { TUNING } from '../config/GameConfig';

let currentKey: string | null = null;
let current: Phaser.Sound.BaseSound | null = null;

/**
 * Plays looping background music. Sounds live on the global sound manager, so
 * a track keeps playing across scene switches; asking for the key that's
 * already playing is a no-op (no restart between screens sharing a theme).
 * The global mute toggle covers music too.
 */
export const MusicManager = {
  play(scene: Phaser.Scene, key: string): void {
    if (currentKey === key && current?.isPlaying) return;
    this.stop();
    if (!scene.cache.audio.exists(key)) return; // no track — play nothing
    current = scene.sound.add(key, { loop: true, volume: TUNING.audio.musicVolume });
    current.play();
    currentKey = key;
  },

  stop(): void {
    current?.stop();
    current?.destroy();
    current = null;
    currentKey = null;
  },
};
