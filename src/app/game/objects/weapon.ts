import * as Phaser from 'phaser';
import { GameObjects, Scene } from 'phaser';
import { ItemEffects } from '../core/item-effects.manager';
import { GameState } from '../core/game-state.manager';

export abstract class Weapon extends GameObjects.Sprite {
    range: number = 200;
    damage: number = 10;
    cooldown: number = 1000;
    fireTimer: number = 0;

    constructor(scene: Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        this.setDisplaySize(96, 96);
    }

    abstract fire(target: any, time: number): void;

    override update(time: number, delta: number): void {
        const scaledDelta = delta * this.scene.time.timeScale;

        // Obtener tipos de torres para Synergy Core
        const towerTypes = (this.scene as any).getUniqueTowerTypeCount?.() || 0;

        // Aplicar multiplicador de velocidad de ataque al cooldown
        const effectiveCooldown = this.cooldown / ItemEffects.getAttackSpeedMultiplier(towerTypes);

        // Comprobación de Cooldown
        this.fireTimer -= scaledDelta;
        if (this.fireTimer > 0) return;

        // Buscar Objetivo con rango aumentado por items
        const target = this.findTarget(towerTypes);
        if (target) {
            this.fire(target, time);
            this.fireTimer = effectiveCooldown;

            // Rapid Battery Cell: chance de restaurar escudo al disparar
            ItemEffects.tryShieldRestore();
        }
    }

    /**
     * Busca el enemigo más cercano dentro del rango (modificado por items).
     */
    findTarget(towerTypes: number = 0): any {
        const scene = this.scene as any;
        if (!scene.enemies) return null;

        const effectiveRange = this.range * ItemEffects.getRangeMultiplier(towerTypes);
        let closestEnemy: any = null;
        let minDistanceSq = effectiveRange * effectiveRange;

        scene.enemies.getChildren().forEach((enemy: any) => {
            if (enemy.active && enemy.visible) {
                const distSq = Phaser.Math.Distance.Squared(this.x, this.y, enemy.x, enemy.y);
                if (distSq <= minDistanceSq) {
                    minDistanceSq = distSq;
                    closestEnemy = enemy;
                }
            }
            return true;
        });

        return closestEnemy;
    }

    /**
     * Método helper para disparar una bala con daño modificado por items.
     */
    protected spawnBullet(target: any, texture: string = 'bullet', tint: number = 0xffffff, speed: number = 0.5) {
        const mainScene = this.scene as any;
        const towerTypes = mainScene.getUniqueTowerTypeCount?.() || 0;

        // Calcular daño final con multiplicadores
        let finalDamage = this.damage * ItemEffects.getDamageMultiplier(towerTypes);

        // Crit check
        const isCrit = ItemEffects.rollCrit();
        if (isCrit) {
            finalDamage *= 2;
            tint = 0xffff00; // Amarillo para crits
        }

        // Debug: log cuando hay items activos
        if (GameState.inventory().length > 0) {
            console.log(`⚔️ Torre dispara: base=${this.damage} → final=${finalDamage.toFixed(1)} (x${ItemEffects.getDamageMultiplier(towerTypes).toFixed(2)}) ${isCrit ? '💥CRIT!' : ''}`);
        }

        if (mainScene.bullets) {
            const bullet = mainScene.bullets.get();
            if (bullet) {
                bullet.setTexture(texture);
                bullet.setTint(tint);
                bullet.fire(this.x, this.y, target, finalDamage);
                bullet.speed = speed;

                // Asegurar tamaño razonable para la bala y rotación hacia el objetivo
                bullet.setDisplaySize(32, 32);
                const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
                bullet.setRotation(angle - Math.PI / 2);
            }
        }
    }
}
