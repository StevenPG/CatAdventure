import { SAVE_KEY } from '../config/GameConfig';
import type { SaveData } from '../types';

const EMPTY: SaveData = {
  unlockedLevel: 0,
  levelStats: {},
  lastCatId: null,
};

/** Thin, defensive wrapper over localStorage. All progress lives here. */
export class SaveManager {
  private static instance: SaveManager;
  private data: SaveData;

  private constructor() {
    this.data = SaveManager.load();
  }

  static get(): SaveManager {
    if (!SaveManager.instance) SaveManager.instance = new SaveManager();
    return SaveManager.instance;
  }

  private static load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(EMPTY);
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return { ...structuredClone(EMPTY), ...parsed };
    } catch {
      return structuredClone(EMPTY);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      /* storage may be unavailable (private mode) — fail silently */
    }
  }

  get unlockedLevel(): number {
    return this.data.unlockedLevel;
  }

  get lastCatId(): string | null {
    return this.data.lastCatId;
  }

  get muted(): boolean {
    return this.data.muted ?? false;
  }

  setMuted(m: boolean): void {
    this.data.muted = m;
    this.persist();
  }

  setLastCat(id: string): void {
    this.data.lastCatId = id;
    this.persist();
  }

  statsFor(levelId: string): { collected: number; completed: boolean } {
    return this.data.levelStats[levelId] ?? { collected: 0, completed: false };
  }

  /** Record a level result; unlocks the next level on completion. */
  recordLevel(levelId: string, levelIndex: number, collected: number, completed: boolean): void {
    const prev = this.statsFor(levelId);
    this.data.levelStats[levelId] = {
      collected: Math.max(prev.collected, collected),
      completed: prev.completed || completed,
    };
    if (completed) {
      this.data.unlockedLevel = Math.max(this.data.unlockedLevel, levelIndex + 1);
    }
    this.persist();
  }

  /** Clear one level's stats (completion + treats). Unlock progression is kept
   *  so you don't lock yourself out of later levels. */
  resetLevel(levelId: string): void {
    delete this.data.levelStats[levelId];
    this.persist();
  }

  reset(): void {
    this.data = structuredClone(EMPTY);
    this.persist();
  }
}
