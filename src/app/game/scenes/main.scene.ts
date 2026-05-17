import * as Phaser from 'phaser';
import { Enemy } from '../objects/enemy';
import { Character } from '../objects/character';
import { Bullet } from '../objects/bullet';
import { GenericWeapon } from '../objects/generic-weapon';
import { GameState } from '../core/game-state.manager';
import { DataManager } from '../core/data.manager';
import { ItemEffects } from '../core/item-effects.manager';

export class MainScene extends Phaser.Scene {
    graphics: Phaser.GameObjects.Graphics | undefined;
    path: Phaser.Curves.Path | undefined;

    enemies: Phaser.GameObjects.Group | undefined;
    bullets: Phaser.GameObjects.Group | undefined;
    weapons: Phaser.GameObjects.Group | undefined;

    placementGraphics: Phaser.GameObjects.Graphics | undefined;
    private pathPoints: Phaser.Math.Vector2[] = [];
    private lastSelectedWeaponType: string | null = null;
    private lastGold: number = -1;

    ghost: Phaser.GameObjects.Sprite | undefined;
    ghostRange: Phaser.GameObjects.Arc | undefined;

    character: Character | undefined;

    spawnTimer: number = 0;
    spawnInterval: number = 1500;

    currentWaveDifficulty: number = 0;
    remainingDifficulty: number = 0;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
    }

    create() {
        this.graphics = this.add.graphics();
        this.placementGraphics = this.add.graphics();
        this.createPath();

        this.enemies = this.add.group({ classType: Enemy, runChildUpdate: true });
        this.bullets = this.add.group({ classType: Bullet, runChildUpdate: true });
        this.weapons = this.add.group({ runChildUpdate: true });

        const firstWeapon = DataManager.data().weapons[0];
        const ghostKey = firstWeapon ? firstWeapon.id + '_icon' : '';
        this.ghost = this.add.sprite(0, 0, ghostKey).setAlpha(0.6).setVisible(false).setDisplaySize(64, 64);
        this.ghostRange = this.add.circle(0, 0, 200, 0x00ff00, 0.2).setVisible(false);

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.tryPlaceWeapon(pointer.x, pointer.y);
            }
        });

        this.createAnimations();

        const characterStats = DataManager.data().character;
        this.character = new Character(this, 1470, 140, characterStats.id + '_sheet', characterStats, this.bullets, this.enemies);
        this.character.setDisplaySize(110, 110);
        this.character.setVisible(true);

        GameState.baseMaxShield.set(characterStats.def);
        GameState.baseMaxHealth.set(characterStats.hp);
        GameState.maxShield.set(characterStats.def);
        GameState.maxHealth.set(characterStats.hp);
        GameState.lives.set(characterStats.hp);
        GameState.refillShield();

        GameState.isWaveActive.set(false);

        if (this.cache.audio.exists('game-music') && !this.sound.get('game-music')) {
            let gameMusicVolume = 0.4;
            const audioService = (this.game as any).audioService;
            if (audioService) {
                const isMusicEnabled = audioService.musicEnabled();
                gameMusicVolume = isMusicEnabled ? audioService.effectiveMusicVolume() : 0;
            }
            this.sound.play('game-music', { loop: true, volume: gameMusicVolume });
        }
    }

    isGameOver: boolean = false;

    override update(time: number, delta: number) {
        if (this.isGameOver) return;

        const audioService = (this.game as any).audioService;
        if (audioService && this.cache.audio.exists('game-music')) {
            const isMusicEnabled = audioService.musicEnabled();
            const targetVolume = isMusicEnabled ? audioService.effectiveMusicVolume() : 0;
            const sound = this.sound.get('game-music') as any;
            if (sound && sound.volume !== targetVolume) {
                sound.setVolume(targetVolume);
            }
        }

        if (GameState.lives() <= 0) {
            this.time.delayedCall(500, () => {
                this.handleGameOver();
            });
            this.isGameOver = true;
            return;
        }

        if (this.character) this.character.update(time, delta);

        this.weapons?.getChildren().forEach((tower: any) => {
            if (tower.active) tower.update(time, delta);
        });

        this.handlePlacementUI();
        this.handleGhostTower();

        if (GameState.isWaveActive()) {
            this.handleWaveLogic(delta);
        }
    }

    createPath() {
        this.path = this.add.path(300, 410);
        this.path.lineTo(480, 410);
        this.path.lineTo(480, 680);
        this.path.lineTo(750, 680);
        this.path.lineTo(750, 140);
        this.path.lineTo(1020, 140);
        this.path.lineTo(1020, 410);
        this.path.lineTo(1200, 410);
        this.path.lineTo(1200, 590)
        this.path.lineTo(1470, 590);
        this.path.lineTo(1470, 140);

        this.pathPoints = this.path.getPoints(100);
    }

    createAnimations() {
        const enemies = DataManager.data().enemies;
        enemies.forEach(e => {
            const animKey = e.id + '_walk';
            const textureKey = e.id + '_sheet';

            if (!this.anims.exists(animKey)) {
                this.anims.create({
                    key: animKey,
                    frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
                    frameRate: 10,
                    repeat: -1
                });
            }
        });
    }

    handleGameOver() {
        this.isGameOver = true;
        this.physics.pause();

        const stats = {
            score: GameState.score(),
            waveReached: GameState.wave(),
            enemiesKilled: GameState.enemiesKilled(),
            timeSurvivedSec: Math.floor((Date.now() - GameState.startTime()) / 1000)
        };
        this.game.events.emit('game-over', stats);
    }

    handlePlacementUI() {
        const selected = GameState.selectedWeapon();
        const gold = GameState.gold();

        if (selected?.type !== this.lastSelectedWeaponType || gold !== this.lastGold) {
            this.lastSelectedWeaponType = selected?.type || null;
            this.lastGold = gold;
            this.drawPlacementZones();
        }
    }

    drawPlacementZones() {
        if (!this.placementGraphics) return;
        this.placementGraphics.clear();

        const selected = GameState.selectedWeapon();
        if (!selected) {
            this.lastSelectedWeaponType = null;
            return;
        }

        this.placementGraphics.fillStyle(0x00ff00, 0.1);
        this.placementGraphics.lineStyle(1, 0x00ff00, 0.2);

        const cellSize = 64;
        const width = Number(this.game.config.width);
        const height = Number(this.game.config.height);

        for (let x = cellSize / 2; x < width; x += cellSize) {
            for (let y = cellSize / 2; y < height; y += cellSize) {
                if (this.canPlaceWeapon(x, y, selected.cost, false)) {
                    this.placementGraphics.strokeRect(x - 30, y - 30, 60, 60);
                    this.placementGraphics.fillRect(x - 30, y - 30, 60, 60);
                }
            }
        }
    }

    handleGhostTower() {
        const selected = GameState.selectedWeapon();
        if (selected && this.ghost && this.ghostRange) {
            const worldPoint = this.input.activePointer.position;

            const snapX = Math.floor(worldPoint.x / 64) * 64 + 32;
            const snapY = Math.floor(worldPoint.y / 64) * 64 + 32;

            this.ghost.setPosition(snapX, snapY).setVisible(true);
            this.ghostRange.setPosition(snapX, snapY).setVisible(true);

            if (this.ghost?.texture.key !== selected.type + '_icon') {
                this.ghost?.setTexture(selected.type + '_icon');
            }

            const isValid = this.canPlaceWeapon(snapX, snapY, selected.cost);
            const tint = isValid ? 0x00ff00 : 0xff0000;
            const rangeColor = isValid ? 0x00ff00 : 0xff0000;

            this.ghost.setTint(tint);
            this.ghostRange.setFillStyle(rangeColor, 0.2);

        } else if (this.ghost) {
            this.ghost.setVisible(false);
            this.ghostRange?.setVisible(false);
        }
    }

    handleWaveLogic(delta: number) {
        const scaledDelta = delta * this.time.timeScale;
        this.spawnTimer += scaledDelta;

        if (this.remainingDifficulty > 0 && this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemy();
            this.spawnTimer -= this.spawnInterval;
        }
        if (GameState.isWaveActive() && this.remainingDifficulty <= 0 && this.enemies?.countActive() === 0) {
            this.endWave();
        }
    }

    canPlaceWeapon(x: number, y: number, cost: number, checkGold: boolean = true): boolean {
        if (checkGold && GameState.gold() < cost) return false;

        const collisionRadiusSq = 1600;

        if (this.pathPoints && this.pathPoints.length > 0) {
            for (const point of this.pathPoints) {
                const dx = x - point.x;
                const dy = y - point.y;
                const dSq = dx * dx + dy * dy;
                if (dSq < collisionRadiusSq) return false;
            }
        }

        if (this.weapons) {
            const towers = this.weapons.getChildren();
            for (const tower of towers as any[]) {
                const dx = x - tower.x;
                const dy = y - tower.y;
                const dSq = dx * dx + dy * dy;
                if (dSq < 3600) return false;
            }
        }

        if (this.character) {
            const dx = x - this.character.x;
            const dy = y - this.character.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < 5000) return false;
        }

        return true;
    }

    tryPlaceWeapon(x: number, y: number) {
        const selected = GameState.selectedWeapon();
        if (!selected) return;

        const snapX = Math.floor(x / 64) * 64 + 32;
        const snapY = Math.floor(y / 64) * 64 + 32;

        if (this.canPlaceWeapon(snapX, snapY, selected.cost)) {
            console.log("Placing tower at", snapX, snapY);

            GameState.updateGold(-selected.cost);

            const tower = new GenericWeapon(this, snapX, snapY, selected.type);
            if (tower) {
                this.weapons?.add(tower);
            }

            GameState.selectedWeapon.set(null);
            this.drawPlacementZones();
            console.log("Tower placed successfully");
        }
    }

    startNextWave() {
        if (GameState.isWaveActive()) return;

        const wave = GameState.wave();
        this.currentWaveDifficulty = Math.floor(10 * Math.pow(1.5, wave - 1));
        this.remainingDifficulty = this.currentWaveDifficulty;

        GameState.isWaveActive.set(true);
        this.spawnTimer = 0;

        const towerTypes = this.getUniqueTowerTypeCount();
        const newMaxShield = Math.floor(GameState.baseMaxShield() * ItemEffects.getMaxShieldMultiplier(towerTypes));
        const newMaxHealth = Math.floor(GameState.baseMaxHealth() * ItemEffects.getMaxHealthMultiplier(towerTypes));
        GameState.maxShield.set(newMaxShield);
        GameState.maxHealth.set(newMaxHealth);

        if (GameState.lives() > newMaxHealth) {
            GameState.lives.set(newMaxHealth);
        }

        this.character?.regenerateShield();
        console.log(`Starting Wave ${wave} with Difficulty ${this.currentWaveDifficulty} | Shield: ${newMaxShield} | MaxHP: ${newMaxHealth}`);
    }

    spawnEnemy() {
        const enemiesData = DataManager.data().enemies;
        if (!enemiesData || enemiesData.length === 0) return;

        const maxDif = Math.min(3, this.remainingDifficulty);
        if (maxDif < 1) return;

        const difficulty = Phaser.Math.Between(1, maxDif);
        const enemyCost = difficulty;

        const randomIndex = Phaser.Math.Between(0, enemiesData.length - 1);
        const enemyStats = enemiesData[randomIndex];

        const enemy = this.enemies?.get();
        if (enemy) {
            enemy.setActive(true);
            enemy.setVisible(true);
            if (this.path) enemy.setup(this.path, enemyStats);

            enemy.setOnDeath(() => {
                GameState.updateGold(enemyStats.reward);
                GameState.updateScore(enemyStats.reward * 10);
                GameState.enemiesKilled.update(v => v + 1);
            });
            enemy.setOnReachBase(() => {
                this.character?.takeDamage(enemy.damage);
            });

            this.remainingDifficulty -= enemyCost;
        }
    }

    endWave() {
        const wave = GameState.wave();
        console.log(`Wave ${wave} completed!`);
        GameState.isWaveActive.set(false);

        const reward = this.currentWaveDifficulty * 10;
        GameState.updateGold(reward);

        GameState.nextWave();

        if (wave % 2 !== 0) {
            console.log(`Ronda ${wave} (impar) - Emitting request-rewards event...`);
            this.game.events.emit('request-rewards');
        } else {
            console.log(`Round ${wave} (even) - No rewards.`);
        }
    }

    getUniqueTowerTypeCount(): number {
        if (!this.weapons) return 0;
        const types = new Set<string>();
        this.weapons.getChildren().forEach((tower: any) => {
            if (tower.active && tower.weaponId) {
                types.add(tower.weaponId);
            }
        });
        return types.size;
    }
}
