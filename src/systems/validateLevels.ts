import { LEVELS } from '../data/levels';
import type { LevelDefinition } from '../types';

/**
 * Dev-only sanity checks for level data (run from BootScene in dev builds).
 * Catches the common authoring mistakes — an exit floating over a pit, an
 * enemy patrolling off its platform, out-of-bounds coordinates — as console
 * warnings before you discover them mid-playtest.
 */
export function validateLevels(): void {
  const ids = new Set<string>();
  for (const level of LEVELS) {
    const warn = (msg: string) => console.warn(`[levels] ${level.id}: ${msg}`);

    if (ids.has(level.id)) warn('duplicate id (save data is keyed by id!)');
    ids.add(level.id);

    const inBounds = (x: number, y: number) => x >= 0 && x <= level.width && y >= 0 && y <= level.height;
    if (!inBounds(level.spawn.x, level.spawn.y)) warn('spawn is out of bounds');
    if (!inBounds(level.exit.x, level.exit.y)) warn('exit is out of bounds');

    // Something solid should be under the spawn, the exit, and each checkpoint.
    if (!hasGroundBelow(level, level.spawn.x, level.spawn.y)) warn('no platform below the spawn');
    if (!hasGroundBelow(level, level.exit.x, level.exit.y)) warn('no platform below the exit');
    for (const cp of level.checkpoints ?? []) {
      if (!hasGroundBelow(level, cp.x, cp.y - 1)) warn(`checkpoint at x=${cp.x} has no platform below it`);
    }

    for (const p of level.platforms) {
      if (p.height < 16) warn(`platform at x=${p.x} is only ${p.height}px tall (<16px risks tunneling)`);
    }

    // Enemies should have footing, and their patrol should fit their platform.
    for (const e of level.enemies) {
      const ground = groundBelow(level, e.x, e.y);
      if (!ground) {
        warn(`enemy at x=${e.x} has no platform below it`);
        continue;
      }
      const patrol = e.patrol ?? 80;
      if (e.x - patrol < ground.x || e.x + patrol > ground.x + ground.width) {
        warn(`enemy at x=${e.x} patrols ±${patrol}px but its platform spans ${ground.x}..${ground.x + ground.width}`);
      }
    }
  }
}

function groundBelow(level: LevelDefinition, x: number, y: number) {
  let best: LevelDefinition['platforms'][number] | undefined;
  for (const p of level.platforms) {
    if (x < p.x || x > p.x + p.width) continue;
    if (p.y < y) continue; // platform top must be at/below the point
    if (!best || p.y < best.y) best = p;
  }
  return best;
}

function hasGroundBelow(level: LevelDefinition, x: number, y: number): boolean {
  return groundBelow(level, x, y) !== undefined;
}
