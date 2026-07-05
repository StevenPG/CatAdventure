# Assets — how to use your own art & sound

**Every sprite and sound in the game is a real file in this folder.** They're
placeholders right now. To use your own, **overwrite the file** — keep the same
name and size, and everything just works. No code to touch.

```
public/assets/
  cats/       one spritesheet per cat  (cats/<id>.png)
  enemies/    the enemy spritesheet     (enemies/enemy.png)
  sfx/        one sound per effect      (sfx/<key>.wav)
  background/ optional room / backdrop art
```

---

## Cats  → `cats/<id>.png`

One file per cat, named by its id:

`eli.png` · `umbra.png` · `bucket.png` · `bitty.png` · `wilson.png` ·
`torture-pixie.png` · `milk.png` · `bones.png` · `wobble.png` · `pancake.png` ·
`triscuit.png` · `bonky.png` · `belby.png`

**To give a cat real art: overwrite its file.** e.g. drop your art over
`cats/eli.png` and Eli uses it — that's the whole process.

Format: a **horizontal spritesheet, 480×48**, i.e. **10 frames of 48×48**, left
to right, in this order:

| Frame | Pose | Used by |
| - | - | - |
| 0 | idle | `idle` |
| 1 | idle (breathe) | `idle` |
| 2 | idle (blink) | `idle` |
| 3–6 | run cycle | `run` |
| 7 | jump | `jump` |
| 8 | fall | `fall` |
| 9 | attack | `attack` |

Run `npm run dev` and open **`/spritesheet-preview.html`** to see the exact
layout rendered and animated. Draw your cat in **full colour** — the game does
not tint real cat art. Different size/frame count? Update that cat's entry in
`SHEETS` (`src/config/assets.ts`).

The ids are set in `src/data/cats.ts`. To add a brand-new cat, add it there and
drop a `cats/<newId>.png` — it wires up automatically.

---

## Enemy  → `enemies/enemy.png`

A **216×36** sheet = **6 frames of 36×36**: `0` idle, `1` idle (blink),
`2–5` walk cycle.

Keep this one **white / greyscale**: the game tints it (orange for walkers,
purple for flyers), so a colourless sheet lets both variants read.

---

## Sounds  → `sfx/<key>.wav`

Overwrite any of these to change a sound (`.wav`, `.mp3`, or `.ogg` all work —
if you use a different extension, update the path in `SFX` in
`src/config/assets.ts`):

`sfx-jump` · `sfx-attack` · `sfx-dash` · `sfx-slam` · `sfx-shoot` · `sfx-glide`
· `sfx-hurt` · `sfx-select` · `sfx-collect`

Each cat chooses which sound it plays in `src/data/cats.ts` (`sounds: { … }`),
so you can point a cat at a different key for a unique voice.

---

## Music  → `music/`

Looping background tracks — gentle generated melodies as placeholder files:

`music/music-menu.wav` · `music/music-outdoor.wav` · `music/music-room.wav`

**Overwrite a file to use your own music.** The audio decoder sniffs content,
not extension, so you can drop mp3/ogg bytes under the same `.wav` name (or
rename the file and update `MUSIC` in `src/config/assets.ts`). Each background
theme picks its track, and a level can override with `music: '<key>'`. Volume
lives in `TUNING.audio.musicVolume`.

---

## Backgrounds  → `background/`

Room and outdoor backdrops are themes (`BACKGROUNDS` in `src/config/assets.ts`).
To use a real image (e.g. a photo of a room), set `src` on the matching
`BG_TEXTURES` entry — for a full painted backdrop use a `tile: false`,
`anchor: 'fill'`, `parallax: 0` layer. Full details in
[ANIMATION.md → Backgrounds](../../ANIMATION.md#backgrounds).

---

## Notes

- Files are served from the web root: `public/assets/cats/eli.png` loads as
  `assets/cats/eli.png` (already wired — don't change the path).
- Want the built-in placeholder back for something? Delete/blank the `src` on
  its entry in `src/config/assets.ts` and the game regenerates it procedurally.
