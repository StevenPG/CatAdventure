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
| Back to menu    | `Esc`                                                 |
| Pick level      | `1`–`9` on the level select                           |

Stomp enemies from above **or** hit them with attacks, projectiles, or a
ground-slam. Collect treats. Reach the green exit to clear the level. Progress
is saved to `localStorage`.

## Architecture

Everything about a cat — and every level — is **data**. Abilities and screen
effects are pluggable modules referenced by id, so adding content rarely means
touching engine code.

```
src/
  main.ts                     # Phaser.Game bootstrap + scene list
  config/GameConfig.ts        # tunable constants (physics, combat, colors)
  types.ts                    # shared interfaces (CatDefinition, GameWorld, ...)
  data/
    cats.ts                   # THE ROSTER — your 13 cats live here
    levels.ts                 # level layouts as plain data
  entities/
    Player.ts                 # the controllable cat; re-equips on switch
    Enemy.ts                  # patrolling enemy
    Collectible.ts            # treat
  cats/
    abilities/                # one file per active ability + registry
    effects/                  # screen-effect specs (vignette/tint) + registry
  systems/
    CatManager.ts             # roster + active-cat switching (emits events)
    SaveManager.ts            # localStorage progress
    AudioManager.ts           # plays sound keys; no-ops until audio is loaded
  scenes/
    BootScene.ts              # boot
    PreloadScene.ts           # generates placeholder textures (swap for real art)
    LevelSelectScene.ts       # level picker (locked/unlocked, treat counts)
    GameScene.ts              # gameplay; implements GameWorld for abilities
    UIScene.ts                # parallel overlay: HUD, cat bar, screen effects
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

### Adding your art & sound

1. **Sprites:** load real sheets in `PreloadScene.preload()` under per-cat
   texture keys, build animations, and have `Player.setCat` select the cat's
   sheet/animations instead of tinting the placeholder. Delete the matching
   `make*Texture` generator.
2. **Audio:** load files in `PreloadScene` under the `sounds` keys already
   referenced in `cats.ts` (e.g. `sfx-jump`, `sfx-dash`). `AudioManager`
   silently no-ops on missing keys, so they light up the moment files exist.

## Tech

Phaser 3 (Arcade physics) · TypeScript (strict) · Vite. No backend — static
files, hostable anywhere.
