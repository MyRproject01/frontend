import { Scene, GameObjects, Math as PhaserMath } from 'phaser';
import { Bullet } from './bullet';
import { Enemy } from './enemy';
import { GameState } from '../core/game-state.manager';
import { ItemEffects } from '../core/item-effects.manager';
import * as Phaser from 'phaser';

export interface CharacterStats {
    dmg: number;
    hp: number;
    def: number;
    attackSpeed: number;
    range: number;
}

export class Character extends GameObjects.Sprite {
    id: string;

    dmg: number;
    hp: number;
    def: number;
    attackSpeed: number;
    range: number;

    fireTimer: number = 0;
    bullets: Phaser.GameObjects.Group;
    enemies: Phaser.GameObjects.Group;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        texture: string,
        stats: CharacterStats,
        bullets: Phaser.GameObjects.Group,
        enemies: Phaser.GameObjects.Group
    ) {
        super(scene, x, y, texture);

        this.id = Math.random().toString(36).substr(2, 9);
        this.dmg = stats.dmg;
        this.hp = stats.hp;
        this.def = stats.def;
        this.attackSpeed = stats.attackSpeed;
        this.range = stats.range;

        this.bullets = bullets;
        this.enemies = enemies;

        scene.add.existing(this);
        
        const animKey = `${texture}_loop`;
        if (!scene.anims.exists(animKey)) {
            scene.anims.create({
                key: animKey,
                frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }
        this.play(animKey);

        console.log(`Personaje Inicializado con Animación. Rango: ${this.range}, Daño: ${this.dmg}`);
    }

    override update(time: number, delta: number) {
        if (this.anims && this.anims.isPlaying) {
            const globalTimeScale = this.scene.time.timeScale || 1;
            this.anims.timeScale = 1 / globalTimeScale;
        }

        const scaledDelta = delta * this.scene.time.timeScale;

        const towerTypes = (this.scene as any).getUniqueTowerTypeCount?.() || 0;

        const effectiveCooldown = 1000 / (this.attackSpeed * ItemEffects.getAttackSpeedMultiplier(towerTypes));

        this.fireTimer -= scaledDelta;

        if (this.fireTimer <= 0) {
            const target = this.getClosestEnemy(towerTypes);

            if (target) {
                this.shoot(target, towerTypes);
                this.fireTimer = effectiveCooldown;

                ItemEffects.tryShieldRestore();
            }
        }
    }

    getClosestEnemy(towerTypes: number = 0): Enemy | null {
        const effectiveRange = this.range * ItemEffects.getRangeMultiplier(towerTypes);
        let closest: Enemy | null = null;
        let minDistanceSq = effectiveRange * effectiveRange;

        this.enemies.getChildren().forEach((child: any) => {
            const enemy = child as Enemy;

            if (enemy.active) {
                const distSq = PhaserMath.Distance.Squared(this.x, this.y, enemy.x, enemy.y);

                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closest = enemy;
                }
            }
        });

        return closest;
    }

    shoot(target: Enemy, towerTypes: number = 0) {
        const bullet = this.bullets.get(this.x, this.y) as Bullet;
        if (bullet) {
            let finalDamage = this.dmg * ItemEffects.getDamageMultiplier(towerTypes);

            const isCrit = ItemEffects.rollCrit();
            let tint = 0xffffff;
            if (isCrit) {
                finalDamage *= 2;
                tint = 0xffff00;
            }

            if (GameState.inventory().length > 0) {
                console.log(`🛡️ Personaje dispara: base=${this.dmg} → final=${finalDamage.toFixed(1)} (x${ItemEffects.getDamageMultiplier(towerTypes).toFixed(2)}) ${isCrit ? '💥CRIT!' : ''}`);
            }

            const characterId = this.texture.key.replace('_sheet', '');
            const bulletTexture = characterId + '_bullet';

            bullet.setTexture(bulletTexture);
            bullet.setTint(tint);
            bullet.setDisplaySize(32, 32);

            const angle = Phaser.Math.Angle.Between(this.x, this.y - 40, target.x, target.y);
            bullet.setRotation(angle - Math.PI);

            bullet.fire(this.x, this.y - 40, target, finalDamage);
        }
    }

    regenerateShield() {
        GameState.refillShield();
    }

    takeDamage(amount: number) {
        GameState.takeBaseDamage(amount);
    }
}
