# Level Design Guide

Levels are plain data — no editor required. They live in
[`src/data/levels.ts`](src/data/levels.ts) as an array of `LevelDefinition`
(typed in [`src/types.ts`](src/types.ts)). Add or edit an entry and it shows up
in the level select automatically.

---

## The shape of a level

```ts
{
  id: 'backyard',          // unique id; used for save data
  name: 'The Backyard',    // shown on the level-select card
  width: 2600,             // world size in pixels
  height: 540,             // keep at 540 (the camera viewport height)
  spawn: { x: 80, y: 420 },  // where the cat starts
  exit:  { x: 2520, y: 440 }, // the green door that completes the level
  platforms: [
    { x: 0, y: 500, width: 900, height: 40 },              // solid ground
    { x: 360, y: 400, width: 140, height: 24 },            // floating platform
    { x: 2080, y: 420, width: 60, height: 60, breakable: true }, // smashable block
  ],
  enemies: [
    { x: 640, y: 460, patrol: 90 },   // patrols ±90px around x=640
  ],
  collectibles: [
    { x: 430, y: 360 },               // a treat
  ],
}
```

### Coordinates

- World pixels, **origin top-left, +y points down** (y=0 is the top).
- **Platforms** are positioned by their **top-left** corner (`x`, `y`) plus
  `width`/`height`.
- `spawn`, `exit`, `enemies`, and `collectibles` are **center** points.
- The camera follows the cat and is clamped to `0..width` / `0..height`. Make
  levels wide; keep `height` at 540 for now.

### Pits are real

The world's **bottom edge is open** — fall below the level and you get the
gentle "scroll back to start" respawn. So **a gap in the ground is a pit.** To
make solid ground, lay platforms edge to edge; to make a pit, leave a gap.

---

## Add a level

1. Append a `LevelDefinition` to the `LEVELS` array in `src/data/levels.ts`.
2. That's it — it appears as the next card in the level select, and unlocks
   when the previous level is completed.

Unlocking is handled by [`SaveManager`](src/systems/SaveManager.ts): finishing
level _n_ unlocks _n+1_, and best treat counts are saved per level id. (Change a
level's `id` and its save progress resets — ids are the key.)

---

## Field reference

| Field          | Meaning |
| -------------- | ------- |
| `platforms[]`  | `{ x, y, width, height, breakable? }`. `breakable: true` makes a block a ground-slam / pound target. |
| `enemies[]`    | `{ x, y, patrol? }`. `patrol` is how far (px) it walks each way from `x` (default 80). |
| `collectibles[]` | `{ x, y }`. A bobbing treat; counts toward the level's total. |
| `spawn` / `exit` | Start point and the completion door. |
| `movingPlatforms[]` | `{ x, y, width, height, toX, toY, speed? }`. Ping-pongs between its start (`x`,`y`) and (`toX`,`toY`); the cat is carried while riding. Horizontal, vertical, or diagonal. |
| `hazards[]` | `{ x, y, width, height, damage? }`. A spike zone — contact costs health and knocks you back. |
| `flyingEnemies[]` | `{ x, y, rangeX?, rangeY?, speed? }`. Gravity-free; drifts on a sine path. Stomp/swipe/shoot/slam to defeat, like any enemy. |

All three are optional arrays on a level, and every field falls back to a
`TUNING` default (`TUNING.movingPlatform`, `TUNING.hazards`,
`TUNING.flyingEnemy` in [`src/config/GameConfig.ts`](src/config/GameConfig.ts))
when omitted — so you can place one with just coordinates and tune globally, or
override per instance.

```ts
movingPlatforms: [{ x: 940, y: 430, width: 100, height: 18, toX: 1140, toY: 430 }],
hazards: [{ x: 720, y: 480, width: 120, height: 20 }],
flyingEnemies: [{ x: 900, y: 280, rangeX: 90, rangeY: 28, speed: 90 }],
```

---

## Design tips

- **Mind platform thickness.** Keep platforms **≥ ~24px** tall. Fast-falling
  cats (Bitty's pound) can punch through paper-thin platforms between physics
  steps. The ground is 40px for this reason.
- **Design around cat-switching — that's the game.** Cats differ a lot:
  - Low jump: Eli, Umbra, Bucket, Bitty. High jump: Milk.
  - Air control: Wilson (slow float), Torture Pixie (hover), the glide cat.
  - Smashers: Umbra, Bitty (breakable blocks).
  Make stretches that *reward the right cat*, but make sure the level is
  **clearable** — either every gap is doable by some available cat, or offer an
  alternate route. A gap too wide for a low-jumper is a feature (switch to Milk
  or hover across), not a bug — just don't make it impossible for everyone.
- **Reward exploration.** Tuck treats above high platforms (for jumpers/hover),
  behind breakable blocks (for smashers), or across pits (for floaters).
- **Pace the enemies.** Give a patrolling enemy a platform wide enough for its
  `patrol` range so it doesn't immediately walk off an edge.
- **Place the exit** somewhere that feels like an arrival — the far end, or atop
  a final climb.

---

## Future: Tiled maps

Hand-authored data is great for a handful of levels. If the count grows, the
natural upgrade is to author levels in [Tiled](https://www.mapeditor.org/),
export JSON, and load it as a Phaser tilemap in `GameScene` — replacing the
`platforms` loop while keeping `enemies`/`collectibles`/`spawn`/`exit` as object
layers. The `LevelDefinition` interface is the seam where that would plug in.
