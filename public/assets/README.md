# Assets

Drop real art and audio here, then point the manifest at it in
`src/config/assets.ts`. Files in `public/` are served at the web root, so a file
at `public/assets/cats/pounce.png` is referenced as `assets/cats/pounce.png`.

Until a file exists, the game uses a generated placeholder — nothing breaks if a
folder is empty.

```
public/assets/
  cats/         # per-cat spritesheets
  sfx/          # sound effects
  background/   # optional background images
```

## Cat spritesheets (`cats/`)

One horizontal strip per cat. The default frame size is **48×48**, **10 frames**,
left to right, in this exact order:

| Frame | Pose            | Used by animation |
| ----- | --------------- | ----------------- |
| 0     | idle            | `idle` (0,1,0,2) |
| 1     | idle (breathe)  | `idle` |
| 2     | idle (blink)    | `idle` |
| 3     | run 1           | `run` (3,4,5,6) |
| 4     | run 2           | `run` |
| 5     | run 3           | `run` |
| 6     | run 4           | `run` |
| 7     | jump            | `jump` |
| 8     | fall            | `fall` |
| 9     | attack          | `attack` |

Run `npm run dev` and open **`/spritesheet-preview.html`** to see this layout
rendered and animated live — it's the visual spec for the real sheet.

To use one, add an entry to `SHEETS` in `src/config/assets.ts` and set the cat's
`spriteSheet` in `src/data/cats.ts`:

```ts
// assets.ts
SHEETS = {
  'cat-pounce': { src: 'assets/cats/pounce.png', frameWidth: 48, frameHeight: 48, frameCount: 6, generator: 'cat' },
  // ...
}

// cats.ts
{ id: 'pounce', /* ... */ spriteSheet: 'cat-pounce' }
```

Different frame size or count? Update `frameWidth`/`frameHeight`/`frameCount`
on the entry, and the frame indices in `CAT_ANIMS` if your layout differs.
(`generator` is only used for the placeholder when `src` is missing — leave it.)

The enemy sheet works the same way (`enemy` key, default **36×36**, **6 frames**:
`0-1` idle/blink, `2-5` walk cycle, mapped by `ENEMY_ANIMS`).

## Sound effects (`sfx/`)

`.wav`, `.mp3`, or `.ogg`. Set `src` on the matching key in `SFX`
(`src/config/assets.ts`):

```ts
'sfx-jump': { src: 'assets/sfx/jump.wav', tone: { /* ignored when src is set */ } },
```

Keys the game plays: `sfx-jump`, `sfx-attack`, `sfx-dash`, `sfx-slam`,
`sfx-shoot`, `sfx-glide`, `sfx-hurt`, `sfx-select`, `sfx-collect`. Each cat's
`sounds` in `cats.ts` references these keys — point a cat at a different key to
give it a unique sound.

## Background (`background/`)

Optional. Edit colors/parallax in `BACKGROUND` (`src/config/assets.ts`), or load
real images for the layer keys (`bg-sky`, `bg-hills-far`, `bg-hills-near`) in
`PreloadScene` and remove the matching generator.
