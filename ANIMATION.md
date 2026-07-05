# Animation & Background Guide

How the sprite/animation pipeline works, how to add a new animation, and how to
replace the background. For dropping in real art files, see
[`public/assets/README.md`](public/assets/README.md).

---

## How animation works

The pipeline is data-driven, in three steps:

1. **Sheet** — a horizontal strip of equal frames. Declared in
   [`src/config/assets.ts`](src/config/assets.ts) under `SHEETS`. Each entry has
   a frame size, a frame count, an optional real-file `src`, and a placeholder
   `generator`. With no `src`, a placeholder sheet is synthesized at runtime by
   [`PlaceholderFactory`](src/systems/PlaceholderFactory.ts).

2. **Animation layout** — which frame indices make up each named animation, and
   how fast. Declared as `AnimDef`s in `CAT_ANIMS` / `ENEMY_ANIMS` in
   `assets.ts`. `repeat: -1` loops, `0` plays once.

3. **Creation + playback** — [`PreloadScene`](src/scenes/PreloadScene.ts) turns
   each layout into a Phaser animation keyed `"<sheet>-<name>"` (e.g.
   `cat-run`, `enemy-walk`). Entities play them:
   [`Player`](src/entities/Player.ts) picks one each frame from its physics
   state (`updateAnimation`); [`Enemy`](src/entities/Enemy.ts) plays `enemy-walk`.

> **See it live:** run `npm run dev` and open
> [`/spritesheet-preview.html`](spritesheet-preview.html) — it renders every
> frame and plays every animation. This is the visual spec for real art.

### Current frame layouts

- **Cat** — `48×48`, 10 frames: `0-2` idle/breathe/blink, `3-6` run cycle,
  `7` jump, `8` fall, `9` attack.
- **Enemy** — `36×36`, 6 frames: `0-1` idle/blink, `2-5` walk cycle.

Real sheets just need to follow this frame order under the same texture key.

---

## Add a new animation

Example: give cats a **hurt** flinch.

**1. Add the frame(s).** In a real sheet, add the art and bump `frameCount`. For
the placeholder, add a pose in `PlaceholderFactory` (the cat's `poses` array)
and bump `frameCount` to match:

```ts
// src/config/assets.ts → SHEETS
cat: { frameWidth: 48, frameHeight: 48, frameCount: 11, generator: 'cat' },
```

**2. Declare the animation** in `assets.ts`:

```ts
// src/config/assets.ts → CAT_ANIMS
hurt: { frames: [10], frameRate: 1, repeat: 0 },
```

That's all `PreloadScene` needs — it creates `cat-hurt` automatically for every
cat sheet.

**3. Trigger it.** Animations are played via `Player.playAnim(name)`. For a
state that should briefly override the movement animation (like attack), gate
`updateAnimation` with a timer. In [`Player`](src/entities/Player.ts):

```ts
// when hit:
takeDamage(now: number): boolean {
  // ...existing...
  this.hurtAnimUntil = now + 250;
  this.playAnim('hurt', false);
  // ...
}

// in updateAnimation(now), before the movement choice:
if (now < this.hurtAnimUntil) return;   // hold the hurt pose
```

(The existing `attack` animation works exactly this way via `attackAnimUntil` —
copy that pattern.)

### Add a whole new spritesheet

For a new entity (a second enemy type, an NPC, a boss):

1. Add a `SHEETS` entry (`src` for real art, or a `generator` for a placeholder).
2. Add an `<thing>_ANIMS` layout object in `assets.ts`.
3. Create its animations in `PreloadScene` — mirror `createEnemyAnimations()`
   (loop the layout, call `this.anims.create(...)` keyed `"<sheet>-<name>"`).
4. Play them on your entity with `sprite.anims.play('<sheet>-<name>', true)`.

For per-cat real art, give each cat its own sheet key in `SHEETS` and set
`spriteSheet: '<key>'` on that cat in [`src/data/cats.ts`](src/data/cats.ts) —
`PreloadScene.createCatAnimations()` already builds the standard set for every
distinct cat sheet.

### Sprite-level quirks (not animations)

Some cats have a physical trait that isn't really a *pose* — Wobble's
continuous tremor, for example. These are **quirks** (`QuirkId` in
`types.ts`), layered on top of whatever animation is already playing, applied
in `Player.updateQuirk()`. They only ever touch `sprite.angle` (or another
transform Arcade Physics never writes to), so they're safe to set every frame
with zero risk of fighting the physics body's position/velocity sync.

To add one: add an id to `QuirkId`, add its tuning to `TUNING.quirks` in
`GameConfig.ts`, branch on it in `Player.updateQuirk()`, and set
`quirk: '<id>'` on a cat in `cats.ts`.

---

## Backgrounds

Backgrounds are **themes** a level picks with `background: '<id>'` (see
[LEVELS.md](LEVELS.md)). Everything lives in
[`src/config/assets.ts`](src/config/assets.ts) in two pieces:

**`BG_TEXTURES`** — every background image, each with a real-file `src` or a
placeholder `generate` recipe (`sky`, `hills`, `wall`, `solid`):

```ts
export const BG_TEXTURES = {
  'bg-sky':        { generate: { kind: 'sky', top: 0x1a1c2c, bottom: 0x3b3a6b } },
  'bg-hills-far':  { generate: { kind: 'hills', color: 0x29366f, height: 220 } },
  'bg-room-wall':  { generate: { kind: 'wall', base: 0x342640, line: 0x483452 } },
  // ...
};
```

**`BACKGROUNDS`** — named themes that compose those textures into layers:

```ts
export const BACKGROUNDS = {
  outdoor: {
    baseColor: 0x1a1c2c,
    layers: [
      { key: 'bg-sky',        parallax: 0,    tile: false, anchor: 'fill' },
      { key: 'bg-hills-far',  parallax: 0.2,  anchor: 'bottom', height: 220 },
      { key: 'bg-hills-near', parallax: 0.45, anchor: 'bottom', height: 150 },
    ],
  },
  room: { /* fixed dark backing + a wall pattern that scrolls at 0.65 */ },
};
```

Each **layer**:
- `parallax` — `0` = fixed, `1` = scrolls with the world. Lower = further away.
- `tile` — `true` (default) repeats the texture and scrolls; `false` is a single
  fixed full-screen image (use with `parallax: 0` for a painted backdrop).
- `anchor` — `'fill'` covers the whole screen (great for interior rooms),
  `'bottom'`/`'top'` are strips (hills, ceilings) with a `height`.
- optional `tint`.

### Recolor / retune / add a theme
Edit the generator colors in `BG_TEXTURES`, or the layer list in `BACKGROUNDS`.
To make a new theme (e.g. `'cave'`), add an entry to `BACKGROUNDS` and point a
level's `background` at it.

### Interior rooms that scroll
Use a theme like `room`: a `tile: false` fixed backing plus a `tile: true`,
`anchor: 'fill'` wall pattern at `parallax` ~0.6, so the room reads as a space
you move through. Rendered by
[`GameScene.buildBackground()` / `updateBackground()`](src/scenes/GameScene.ts).

### Use real background art
Set `src` on any `BG_TEXTURES` entry (e.g. `src: 'assets/background/room.png'`)
and drop the file in `public/assets/background/`. The layer keeps its key; no
code changes. For a hand-painted full-screen backdrop, use `tile: false`,
`anchor: 'fill'`, `parallax: 0`. For a seamless repeating pattern, use
`tile: true`.
