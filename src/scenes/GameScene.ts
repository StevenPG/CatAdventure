import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TUNING } from '../config/GameConfig';
import { BACKGROUNDS, DEFAULT_BACKGROUND } from '../config/assets';
import { LEVELS } from '../data/levels';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { FlyingEnemy } from '../entities/FlyingEnemy';
import { MovingPlatform } from '../entities/MovingPlatform';
import { Hazard } from '../entities/Hazard';
import { Collectible } from '../entities/Collectible';
import { CatManager, CatEvents } from '../systems/CatManager';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import type { CatDefinition, EnemyLike, GameWorld, LevelDefinition } from '../types';

interface GameInit {
  levelIndex: number;
}

/** The gameplay scene. Implements GameWorld so abilities can reach back into it.
 *  HUD/cat-bar rendering live in the parallel UIScene; this scene emits 'hud'
 *  events for it to consume. */
export class GameScene extends Phaser.Scene implements GameWorld {
  catManager!: CatManager;

  private level!: LevelDefinition;
  private levelIndex = 0;
  private player!: Player;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private breakables!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: EnemyLike[] = [];
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private flyerGroup!: Phaser.Physics.Arcade.Group;
  private movingPlatforms: MovingPlatform[] = [];
  private hazards: Hazard[] = [];
  private collectibleGroup!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private exit!: Phaser.Physics.Arcade.Image;
  private audio!: AudioManager;
  private bgLayers: { sprite: Phaser.GameObjects.TileSprite; parallax: number; fill: boolean }[] = [];

  private collected = 0;
  private total = 0;
  private finished = false;
  private respawning = false;

  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
    special: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super('Game');
  }

  init(data: GameInit): void {
    this.levelIndex = data?.levelIndex ?? 0;
    this.level = LEVELS[this.levelIndex];
    this.collected = 0;
    this.finished = false;
    this.respawning = false;
    this.enemies = [];
    this.movingPlatforms = [];
    this.hazards = [];
    this.bgLayers = [];
  }

  create(): void {
    this.physics.world.gravity.y = TUNING.physics.gravityY;
    this.physics.world.setBounds(0, 0, this.level.width, this.level.height);
    // Open the bottom edge so pits are real falls (triggers the soft respawn).
    // Left/right/top still contain the player.
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height);
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.audio = new AudioManager(this);

    this.buildBackground();
    this.buildPlatforms();
    this.buildMovingPlatforms();
    this.buildHazards();
    this.buildExit();
    this.buildCollectibles();
    this.buildEnemies();
    this.buildProjectiles();

    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
    this.total = this.level.collectibles.length;

    // Cat roster + switching. Player re-equips whenever the active cat changes.
    this.catManager = new CatManager();
    this.catManager.on(CatEvents.Changed, (cat: CatDefinition) => this.player.setCat(cat));
    this.catManager.emitInitial();

    this.setupColliders();
    this.setupInput();

    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

    // Run the HUD / cat-bar / screen-effect overlay in parallel.
    this.scene.launch('UI');
    this.emitHud();
  }

  // --- Build helpers ---

  /** Build the level's background theme (outdoor parallax, scrolling room, or a
   *  custom theme). Tiled layers scroll fractionally with the camera; a
   *  `tile: false` layer is a single fixed full-screen image. */
  private buildBackground(): void {
    const theme = BACKGROUNDS[this.level.background ?? DEFAULT_BACKGROUND] ?? BACKGROUNDS[DEFAULT_BACKGROUND];
    if (theme.baseColor !== undefined) this.cameras.main.setBackgroundColor(theme.baseColor);

    theme.layers.forEach((layer, i) => {
      const depth = -100 + i;
      const tile = layer.tile ?? true;
      if (!tile) {
        const img = this.add
          .image(0, 0, layer.key)
          .setOrigin(0, 0)
          .setScrollFactor(layer.parallax)
          .setDepth(depth)
          .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
        if (layer.tint !== undefined) img.setTint(layer.tint);
        return;
      }
      const anchor = layer.anchor ?? 'bottom';
      let sprite: Phaser.GameObjects.TileSprite;
      if (anchor === 'fill') {
        sprite = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, layer.key).setOrigin(0, 0);
      } else if (anchor === 'top') {
        sprite = this.add.tileSprite(0, 0, GAME_WIDTH, layer.height ?? 200, layer.key).setOrigin(0, 0);
      } else {
        sprite = this.add.tileSprite(0, GAME_HEIGHT, GAME_WIDTH, layer.height ?? 200, layer.key).setOrigin(0, 1);
      }
      sprite.setScrollFactor(0).setDepth(depth);
      if (layer.tint !== undefined) sprite.setTint(layer.tint);
      this.bgLayers.push({ sprite, parallax: layer.parallax, fill: anchor === 'fill' });
    });
  }

  private updateBackground(): void {
    const cam = this.cameras.main;
    for (const layer of this.bgLayers) {
      layer.sprite.tilePositionX = cam.scrollX * layer.parallax;
      if (layer.fill) layer.sprite.tilePositionY = cam.scrollY * layer.parallax;
    }
  }

  private buildPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    this.breakables = this.physics.add.staticGroup();
    for (const p of this.level.platforms) {
      const group = p.breakable ? this.breakables : this.platforms;
      const img = group.create(p.x + p.width / 2, p.y + p.height / 2, 'tile') as Phaser.Physics.Arcade.Image;
      img.setDisplaySize(p.width, p.height);
      img.setTint(p.breakable ? COLORS.platformBreakable : COLORS.platform);
      img.refreshBody();
      // Crisp top edge highlight (purely decorative, no body).
      this.add
        .image(p.x + p.width / 2, p.y, 'tile')
        .setDisplaySize(p.width, 4)
        .setOrigin(0.5, 0)
        .setTint(p.breakable ? COLORS.platformBreakableTop : COLORS.platformTop)
        .setDepth(1);
    }
  }

  private buildExit(): void {
    this.exit = this.physics.add.staticImage(this.level.exit.x, this.level.exit.y, 'tile');
    this.exit.setDisplaySize(44, 88).setTint(COLORS.exit).refreshBody();
  }

  private buildCollectibles(): void {
    this.collectibleGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const c of this.level.collectibles) {
      const item = new Collectible(this, c.x, c.y);
      this.collectibleGroup.add(item.sprite);
      item.sprite.setData('ref', item);
    }
  }

  private buildMovingPlatforms(): void {
    for (const def of this.level.movingPlatforms ?? []) {
      this.movingPlatforms.push(new MovingPlatform(this, def));
    }
  }

  private buildHazards(): void {
    for (const def of this.level.hazards ?? []) {
      this.hazards.push(new Hazard(this, def));
    }
  }

  private buildEnemies(): void {
    this.enemyGroup = this.physics.add.group();
    for (const e of this.level.enemies) {
      const enemy = new Enemy(this, e.x, e.y, e.patrol);
      this.enemyGroup.add(enemy.sprite);
      this.enemies.push(enemy);
    }
    // Flying enemies live in their own group (no platform collision).
    this.flyerGroup = this.physics.add.group({ allowGravity: false });
    for (const f of this.level.flyingEnemies ?? []) {
      const flyer = new FlyingEnemy(this, f);
      this.flyerGroup.add(flyer.sprite);
      this.enemies.push(flyer);
    }
  }

  private buildProjectiles(): void {
    this.projectiles = this.physics.add.group({ allowGravity: false });
  }

  private setupColliders(): void {
    const sprite = this.player.sprite;
    this.physics.add.collider(sprite, this.platforms);
    this.physics.add.collider(sprite, this.breakables);
    this.physics.add.collider(this.enemyGroup, this.platforms);
    this.physics.add.collider(this.enemyGroup, this.breakables);

    // Moving platforms are one-way riders handled manually in update (no
    // collider — a collider's vertical push fights the carry and slides the
    // rider off).

    this.physics.add.overlap(sprite, this.enemyGroup, (_p, e) =>
      this.onPlayerEnemy(e as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(sprite, this.flyerGroup, (_p, e) =>
      this.onPlayerEnemy(e as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(sprite, this.collectibleGroup, (_p, c) =>
      this.onCollect(c as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(sprite, this.exit, () => this.completeLevel());
    for (const hazard of this.hazards) {
      this.physics.add.overlap(sprite, hazard.zone, () => this.onHazard(hazard));
    }

    this.physics.add.collider(this.projectiles, this.platforms, (proj) => proj.destroy());
    this.physics.add.collider(this.projectiles, this.breakables, (proj) => proj.destroy());
    this.physics.add.overlap(this.projectiles, this.enemyGroup, (proj, e) => {
      (proj as Phaser.Physics.Arcade.Image).destroy();
      this.hurtEnemy(e as Phaser.Physics.Arcade.Sprite, TUNING.abilities.projectile.damage);
    });
    this.physics.add.overlap(this.projectiles, this.flyerGroup, (proj, e) => {
      (proj as Phaser.Physics.Arcade.Image).destroy();
      this.hurtEnemy(e as Phaser.Physics.Arcade.Sprite, TUNING.abilities.projectile.damage);
    });
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    const KC = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(KC.LEFT),
      right: kb.addKey(KC.RIGHT),
      a: kb.addKey(KC.A),
      d: kb.addKey(KC.D),
      up: kb.addKey(KC.UP),
      w: kb.addKey(KC.W),
      space: kb.addKey(KC.SPACE),
      attack: kb.addKey(KC.J),
      special: kb.addKey(KC.K),
    };
    // Stop the browser stealing Tab/Space/arrows.
    kb.addCapture([KC.TAB, KC.SPACE, KC.UP, KC.DOWN, KC.LEFT, KC.RIGHT]);
    kb.on('keydown-TAB', (e: KeyboardEvent) => {
      this.catManager.cycle(e.shiftKey ? -1 : 1);
    });
    kb.on('keydown-ESC', () => this.pauseGame());
    kb.on('keydown-P', () => this.pauseGame());
  }

  private pauseGame(): void {
    if (this.finished || this.respawning) return;
    this.scene.launch('Pause');
    this.scene.pause();
  }

  // --- GameWorld implementation (used by abilities) ---

  spawnProjectile(x: number, y: number, direction: number, _reach: number): void {
    const cfg = TUNING.abilities.projectile;
    const proj = this.projectiles.create(x, y, 'projectile') as Phaser.Physics.Arcade.Image;
    proj.setTint(COLORS.projectile);
    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityX(direction * cfg.speed);
    this.time.delayedCall(cfg.lifespanMs, () => proj.active && proj.destroy());
  }

  damageEnemiesInRadius(x: number, y: number, radius: number, damage = 1): void {
    for (const enemy of this.enemies) {
      if (!enemy.sprite.active) continue;
      const d = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y);
      if (d <= radius + enemy.sprite.displayWidth * 0.5) enemy.hurt(damage);
    }
  }

  shatterBreakablesInRadius(x: number, y: number, radius: number): void {
    this.breakables.getChildren().forEach((child) => {
      const img = child as Phaser.Physics.Arcade.Image;
      const d = Phaser.Math.Distance.Between(x, y, img.x, img.y);
      if (d <= radius + img.displayWidth * 0.5) {
        const puff = this.add.circle(img.x, img.y, 18, COLORS.platformBreakable, 0.6);
        this.tweens.add({ targets: puff, alpha: 0, scale: 2, duration: 220, onComplete: () => puff.destroy() });
        this.breakables.killAndHide(img);
        img.destroy();
      }
    });
  }

  // --- Collision handlers ---

  private onPlayerEnemy(enemySprite: Phaser.Physics.Arcade.Sprite): void {
    if (!enemySprite.active || this.finished) return;
    // Dash-strike: barreling through an enemy damages it instead of the player.
    const dashDamage = this.player.dashStrikeDamage;
    if (dashDamage > 0) {
      this.hurtEnemy(enemySprite, dashDamage);
      return;
    }
    const playerBody = this.player.body;
    const stomping =
      playerBody.velocity.y > TUNING.combat.stompVelocityThreshold && this.player.sprite.y < enemySprite.y - 8;
    if (stomping) {
      this.hurtEnemy(enemySprite, TUNING.combat.stompDamage);
      this.player.bounceOffEnemy();
    } else if (this.player.takeDamage(this.time.now)) {
      // knockback away from the enemy
      const away = this.player.sprite.x < enemySprite.x ? -1 : 1;
      playerBody.setVelocity(away * 260, -260);
      this.emitHud();
      if (this.player.health <= 0) this.respawnToStart();
    }
  }

  private hurtEnemy(enemySprite: Phaser.Physics.Arcade.Sprite, damage: number): void {
    const enemy = enemySprite.getData('ref') as EnemyLike | undefined;
    enemy?.hurt(damage);
  }

  private onCollect(sprite: Phaser.Physics.Arcade.Sprite): void {
    const item = sprite.getData('ref') as Collectible | undefined;
    if (!item) return;
    item.collect();
    this.collected += 1;
    this.audio.play('sfx-collect');
    this.emitHud();
  }

  private onHazard(hazard: Hazard): void {
    if (this.finished || this.respawning) return;
    if (this.player.takeDamage(this.time.now)) {
      // Knock away from the hazard's centre (not the facing direction, which
      // could shove the cat deeper into a spike zone it backed into).
      const away = this.player.sprite.x < hazard.zone.x ? -1 : 1;
      this.player.body.setVelocity(away * TUNING.hazards.knockbackX, -TUNING.hazards.knockbackY);
      this.emitHud();
      if (this.player.health <= 0) this.respawnToStart();
    }
  }

  // --- Win / lose ---

  private completeLevel(): void {
    if (this.finished) return;
    this.finished = true;
    SaveManager.get().recordLevel(this.level.id, this.levelIndex, this.collected, true);
    this.showBanner(`${this.level.name} cleared!  ${this.collected}/${this.total} treats`, 0xa7f070);
    this.time.delayedCall(1800, () => this.exitToSelect());
  }

  /** Soft "death": no game-over. Show a gentle message, then scroll the camera
   *  back to the level start with the cat reset there and health refilled.
   *  Treats already collected stay collected. */
  private respawnToStart(): void {
    if (this.respawning || this.finished) return;
    this.respawning = true;

    const body = this.player.body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);

    const cam = this.cameras.main;
    const msg = this.add
      .text(cam.width / 2, cam.height / 2, "Let's try that again 🐾", {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        color: '#ffffff',
        backgroundColor: '#1a1c2c',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 200 });

    // Beat to read the message, then scroll back to the start.
    this.time.delayedCall(TUNING.respawn.messageDelayMs, () => {
      cam.stopFollow();
      this.player.sprite.setPosition(this.level.spawn.x, this.level.spawn.y);
      this.player.resetHealth();
      this.emitHud();
      cam.pan(this.level.spawn.x, this.level.spawn.y, TUNING.respawn.panDurationMs, 'Sine.easeInOut');
      cam.once(Phaser.Cameras.Scene2D.Events.PAN_COMPLETE, () => {
        cam.startFollow(this.player.sprite, true, 0.12, 0.12);
        body.setAllowGravity(true);
        this.player.makeInvulnerable(TUNING.respawn.invulnMs);
        this.tweens.add({ targets: msg, alpha: 0, duration: 300, delay: 150, onComplete: () => msg.destroy() });
        this.respawning = false;
      });
    });
  }

  private showBanner(text: string, color: number): void {
    const cam = this.cameras.main;
    const banner = this.add
      .text(cam.midPoint.x, cam.midPoint.y, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '36px',
        color: '#ffffff',
        backgroundColor: '#1a1c2c',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);
    banner.setColor(Phaser.Display.Color.IntegerToColor(color).rgba);
  }

  private exitToSelect(): void {
    this.scene.stop('UI');
    this.scene.start('LevelSelect');
  }

  // --- HUD bridge ---

  private emitHud(): void {
    this.events.emit('hud', {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      collected: this.collected,
      total: this.total,
    });
  }

  // --- Main loop ---

  override update(time: number, delta: number): void {
    this.updateBackground();
    if (this.finished || this.respawning) return;
    const k = this.keys;

    let dir: -1 | 0 | 1 = 0;
    if (k.left.isDown || k.a.isDown) dir = -1;
    else if (k.right.isDown || k.d.isDown) dir = 1;
    this.player.moveIntent(dir, time);

    // Resolve moving-platform riding before jump input so jumping off works.
    this.rideMovingPlatforms(delta);

    if (
      Phaser.Input.Keyboard.JustDown(k.up) ||
      Phaser.Input.Keyboard.JustDown(k.w) ||
      Phaser.Input.Keyboard.JustDown(k.space)
    ) {
      this.player.jump();
    }
    if (Phaser.Input.Keyboard.JustDown(k.attack)) this.player.attack(time);
    this.player.setSpecialHeld(k.special.isDown);
    if (Phaser.Input.Keyboard.JustDown(k.special)) this.player.useAbility(time);

    this.player.update(time, delta);
    for (const enemy of this.enemies) {
      enemy.update();
      // An enemy that walked off into a pit falls out of the open world bottom;
      // destroy it so it doesn't fall (and update) forever.
      if (enemy.sprite.active && enemy.sprite.y > this.level.height + 400) enemy.sprite.destroy();
    }

    // Fell off the world — scroll back to the start.
    if (this.player.sprite.y > this.level.height + 160) {
      this.respawnToStart();
    }

    this.emitHud();
  }

  /** Moving platforms as one-way riders: move each platform by frame delta-time,
   *  and when the cat is on top (overlapping and not rising) snap it to the
   *  surface and carry it by the platform's exact per-frame displacement. Delta-
   *  driven so cat and platform stay in lockstep at any frame/physics rate. */
  private rideMovingPlatforms(deltaMs: number): void {
    const pb = this.player.body;
    let riding = false;
    for (const mp of this.movingPlatforms) {
      mp.update(deltaMs);
      const overlapX = pb.right > mp.left + 2 && pb.left < mp.right - 2;
      const nearTop = pb.bottom >= mp.top - 10 && pb.bottom <= mp.top + 12;
      if (!riding && overlapX && nearTop && pb.velocity.y >= -10) {
        this.player.sprite.y += mp.top - pb.bottom; // seat feet on the surface
        pb.setVelocityY(0);
        this.player.sprite.x += mp.dx;
        this.player.sprite.y += mp.dy;
        riding = true;
      }
    }
    this.player.setOnPlatform(riding);
  }
}
