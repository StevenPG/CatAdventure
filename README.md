# Cat Adventure 🐾

A 2D sidescroller — a love letter to my cats. Switch between **13 cats** on the
fly, each with unique stats, a special ability, and (for some) a screen effect.
Built to run in any browser.

> Sprites and sounds are placeholders for now (procedurally generated shapes,
> stubbed audio). Real art and audio drop in by editing data — see
> [Adding your art & sound](#adding-your-art--sound).

## Running it

```bash
npm install
npm run dev      # http://localhost:5173 — hot reload
npm run build    # typecheck + production build to dist/
npm run preview  # serve the production build
```

No assets to download — the game generates placeholder graphics at runtime, so
it runs immediately after `npm install`.

## Controls

| Action          | Keys                                                  |
| --------------- | ----------------------------------------------------- |
| Move            | `←` `→` or `A` `D`                                     |
| Jump            | `↑` / `W` / `Space`                                   |
| Attack          | `J`                                                   |
| Special         | `K` (hold for glide-type abilities)                   |
| **Switch cat**  | `Tab` (forward) / `Shift+Tab` (back), or click a face |
| Pause           | `Esc` / `P` (then `M` for level select)               |
| Pick level      | `1`–`9` on the level select                           |

Stomp enemies from above **or** hit them with attacks, projectiles, or a
ground-slam. Collect treats. Reach the green exit to clear the level. Progress
is saved to `localStorage`.

There's no game-over screen: if you run out of health or fall into a pit, the
camera gently scrolls back to the start of the level, health refills, and any
treats you already collected stay collected.

## Architecture

Everything about a cat — and every level — is **data**. Abilities and screen
effects are pluggable modules referenced by id, so adding content rarely means
touching engine code.

```
src/
  main.ts                     # Phaser.Game bootstrap + scene list
  config/
    GameConfig.ts             # TUNING — ALL gameplay knobs in one place
    assets.ts                 # asset manifest: sprites, animations, sounds, bg
  types.ts                    # shared interfaces (CatDefinition, GameWorld, ...)
  data/
    cats.ts                   # THE ROSTER — your 13 cats live here
    levels.ts                 # level layouts as plain data
  entities/
    Player.ts                 # the controllable cat; animates + re-equips on switch
    Enemy.ts                  # patrolling enemy (walk animation)
    Collectible.ts            # treat
  cats/
    abilities/                # one file per active ability + registry
    effects/                  # screen-effect specs (vignette/tint) + registry
  systems/
    CatManager.ts             # roster + active-cat switching (emits events)
    SaveManager.ts            # localStorage progress
    AudioManager.ts           # plays sound keys; no-ops until audio is loaded
    PlaceholderFactory.ts     # generates placeholder spritesheets + WAV sounds
  scenes/
    BootScene.ts              # boot
    PreloadScene.ts           # loads the manifest (real files or placeholders)
    LevelSelectScene.ts       # level picker (locked/unlocked, treat counts)
    GameScene.ts              # gameplay + parallax background; implements GameWorld
    UIScene.ts                # parallel overlay: HUD, cat bar, screen effects
    PauseScene.ts             # pause overlay
```

**Why it's editable:** `GameScene` exposes a small `GameWorld` interface
(`spawnProjectile`, `damageEnemiesInRadius`, `shatterBreakablesInRadius`), so
abilities and effects never depend on the full scene. The `Player` listens for
`CatManager`'s `Changed` event and re-equips stats + ability + color in one
place (`Player.setCat`). The `UIScene` listens to the same event to move the
cat-bar highlight and apply the screen effect.

## Extending

### Add or edit a cat

Edit `src/data/cats.ts`. Each entry is self-contained:

```ts
{
  id: 'whiskers',
  name: 'Whiskers',
  description: 'The all-rounder.',
  bodyColor: 0xc0cbdc,           // placeholder sprite color
  faceColor: 0xc0cbdc,           // color in the switch bar
  stats: { speed, jumpVelocity, extraJumps, attackReach },
  ability: 'dash',               // active ability id (or 'none')
  effect: 'night-vision',        // passive screen effect id (or 'none')
  sounds: { jump, attack, ability, hurt, select },
}
```

- **New ability:** add an id to `AbilityId` in `types.ts`, implement an
  `Ability` in `cats/abilities/`, and register it in `cats/abilities/index.ts`.
- **New screen effect:** add an id to `EffectId` and a spec in
  `cats/effects/index.ts` (vignette strength/radius + optional color tint).

### Add a level

Append a `LevelDefinition` to `src/data/levels.ts` — platforms (with optional
`breakable`), enemies, collectibles, spawn, and exit, all in world pixels. The
level select picks them up automatically and unlocks them in order.

### Tuning the feel

`src/config/GameConfig.ts` exports one `TUNING` object holding **every gameplay
number**: gravity, jump height, run speed, attack reach/damage, stomp bounce,
each ability's parameters (dash speed, slam radius, projectile speed/cooldown,
glide fall speed), enemy speed, and the soft-respawn timing. Per-cat values in
`cats.ts` are multipliers of these bases, so bumping `baseJumpVelocity` rescales
the whole roster while a single cat can still be `* 1.35`.

### Adding your art & sound

Everything is driven by the manifest in `src/config/assets.ts`. Each entry ships
with a generated placeholder and an optional real-file `src` — set the path,
drop the file in `public/`, and the loader uses it instead. **No code changes.**

1. **Sprites:** in `assets.ts → SHEETS`, set `src` to a spritesheet PNG laid out
   as `frameCount` frames of `frameWidth`×`frameHeight`. Frame order matches
   `CAT_ANIMS` (idle, run, jump, fall, attack). For per-cat art, add a new sheet
   entry and set `spriteSheet: '<key>'` on that cat in `cats.ts`.
2. **Audio:** in `assets.ts → SFX`, set `src` on any key (e.g. `sfx-jump`,
   `sfx-dash`) to a `.wav`/`.mp3`/`.ogg`. The cat `sounds` in `cats.ts` already
   reference these keys.
3. **Background:** edit `assets.ts → BACKGROUND` (sky colors, parallax hill
   layers + factors), or load real images for the layer keys in `PreloadScene`.

Placeholders (animated spritesheets + audible tones) are synthesized by
`PlaceholderFactory`, so the game looks and sounds alive before any real asset
exists.

## Guides

- [ANIMATION.md](ANIMATION.md) — how animations work, adding a new one, and
  replacing the background.
- [LEVELS.md](LEVELS.md) — designing and adding levels.
- [public/assets/README.md](public/assets/README.md) — dropping in real art &
  audio.
- Run `npm run dev` and open `/spritesheet-preview.html` to see the sprite
  sheets rendered and animated.

## Tech

Phaser 3 (Arcade physics) · TypeScript (strict) · Vite. No backend — static
files, hostable anywhere.
