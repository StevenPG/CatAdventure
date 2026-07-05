import Phaser from 'phaser';
import { CATS, CAT_BY_ID, DEFAULT_CAT_ID } from '../data/cats';
import type { CatDefinition } from '../types';
import { SaveManager } from './SaveManager';

export const CatEvents = {
  /** (cat: CatDefinition, index: number) — active cat changed. */
  Changed: 'cat-changed',
} as const;

/**
 * Owns the roster and which cat is currently active. Switching is just an index
 * change + an event; the Player listens and re-equips. Pressing Tab cycles
 * forward, Shift+Tab backward.
 */
export class CatManager extends Phaser.Events.EventEmitter {
  private index = 0;

  constructor() {
    super();
    const last = SaveManager.get().lastCatId ?? DEFAULT_CAT_ID;
    const found = CATS.findIndex((c) => c.id === last);
    this.index = found >= 0 ? found : 0;
  }

  get roster(): readonly CatDefinition[] {
    return CATS;
  }

  get current(): CatDefinition {
    return CATS[this.index];
  }

  get currentIndex(): number {
    return this.index;
  }

  cycle(direction: 1 | -1): void {
    this.setIndex((this.index + direction + CATS.length) % CATS.length);
  }

  selectById(id: string): void {
    const i = CATS.findIndex((c) => c.id === id);
    if (i >= 0) this.setIndex(i);
  }

  private setIndex(i: number): void {
    if (i === this.index) return;
    this.index = i;
    SaveManager.get().setLastCat(this.current.id);
    this.emit(CatEvents.Changed, this.current, this.index);
  }

  /** Emit the initial state so listeners (UI, player) sync on scene start. */
  emitInitial(): void {
    this.emit(CatEvents.Changed, this.current, this.index);
  }
}

export { CAT_BY_ID };
