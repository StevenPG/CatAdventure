import type { LevelDefinition } from '../types';

/**
 * Levels are plain data — edit these arrays to reshape a level. Coordinates are
 * world pixels (origin top-left). Platforms use top-left x/y. A future upgrade
 * is loading these from Tiled JSON, but hand-authored data keeps it editable
 * with zero tooling for now.
 */

const GROUND_Y = 500;

export const LEVELS: LevelDefinition[] = [
  {
    id: 'backyard',
    name: 'The Backyard',
    width: 2600,
    height: 540,
    spawn: { x: 80, y: 420 },
    exit: { x: 2520, y: 440 },
    platforms: [
      // Continuous ground with one gap to jump.
      { x: 0, y: GROUND_Y, width: 900, height: 40 },
      { x: 1040, y: GROUND_Y, width: 1560, height: 40 },
      // Floating platforms.
      { x: 360, y: 400, width: 140, height: 24 },
      { x: 560, y: 320, width: 140, height: 24 },
      { x: 980, y: 300, width: 120, height: 24 },
      { x: 1300, y: 380, width: 160, height: 24 },
      { x: 1560, y: 300, width: 140, height: 24 },
      { x: 1820, y: 240, width: 140, height: 24 },
      // Breakable blocks (ground-slam to clear a shortcut).
      { x: 2080, y: 420, width: 60, height: 60, breakable: true },
      { x: 2080, y: 360, width: 60, height: 60, breakable: true },
      { x: 2300, y: 360, width: 140, height: 24 },
    ],
    enemies: [
      { x: 640, y: 460, patrol: 90 },
      { x: 1200, y: 460, patrol: 120 },
      { x: 1620, y: 270, patrol: 50 },
      { x: 1900, y: 460, patrol: 140 },
    ],
    collectibles: [
      { x: 430, y: 360 },
      { x: 630, y: 280 },
      { x: 1040, y: 260 },
      { x: 1630, y: 260 },
      { x: 1890, y: 200 },
      { x: 2110, y: 320 },
      { x: 2370, y: 320 },
    ],
  },
  {
    id: 'rooftops',
    name: 'The Rooftops',
    width: 2000,
    height: 540,
    spawn: { x: 80, y: 420 },
    exit: { x: 1900, y: 220 },
    platforms: [
      { x: 0, y: GROUND_Y, width: 400, height: 40 },
      { x: 520, y: 440, width: 160, height: 24 },
      { x: 760, y: 360, width: 160, height: 24 },
      { x: 1000, y: 300, width: 160, height: 24 },
      { x: 1240, y: 360, width: 160, height: 24 },
      { x: 1480, y: 300, width: 160, height: 24 },
      { x: 1720, y: 260, width: 280, height: 24 },
    ],
    enemies: [
      { x: 800, y: 330, patrol: 50 },
      { x: 1280, y: 330, patrol: 50 },
      { x: 1780, y: 230, patrol: 90 },
    ],
    collectibles: [
      { x: 600, y: 400 },
      { x: 840, y: 320 },
      { x: 1080, y: 260 },
      { x: 1320, y: 320 },
      { x: 1560, y: 260 },
    ],
  },
];
