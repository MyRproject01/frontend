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
    attackSpeed: number; // Disparos por segundo
    range: number;
}

/**
 * Objeto de Juego: Personaje (Defensor/Torre)
 * 
 * Representa un defensor colocado en el mapa.
 * - Apunta automáticamente a los enemigos más cercanos dentro del rango.
 * - Dispara balas basándose en su Velocidad de Ataque.
 */
export class Character extends GameObjects.Image {
    id: string;

    // Estadísticas
    dmg: number;
    hp: number;
    def: number;
    attackSpeed: number;
    range: number;

    // Estado del Combate
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
        console.log(`Personaje Inicializado. Rango: ${this.range}, Daño: ${this.dmg}`);
    }

    override update(time: number, delta: number) {
        const scaledDelta = delta * this.scene.time.timeScale;

        // Obtener tipos de torres para Synergy Core
        const towerTypes = (this.scene as any).getUniqueTowerTypeCount?.() || 0;

        // Cooldown con multiplicador de velocidad de ataque
        const effectiveCooldown = 1000 / (this.attackSpeed * ItemEffects.getAttackSpeedMultiplier(towerTypes));

        // Comprobar Cooldown
        this.fireTimer -= scaledDelta;

        if (this.fireTimer <= 0) {
            const target = this.getClosestEnemy(towerTypes);

            // Disparar si hay un objetivo válido
            if (target) {
                this.shoot(target, towerTypes);
                this.fireTimer = effectiveCooldown;

                // Rapid Battery Cell: chance de restaurar escudo al disparar
                ItemEffects.tryShieldRestore();
            }
        }
    }

    /**
     * Busca al enemigo activo más cercano dentro del rango (modificado por items).
     * @returns El objeto enemigo o null.
     */
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

    /**
     * Genera (spawnea) una bala dirigida al enemigo con daño modificado por items.
     * @param target El enemigo al que disparar.
     */
    shoot(target: Enemy, towerTypes: number = 0) {
        const bullet = this.bullets.get(this.x, this.y) as Bullet;
        if (bullet) {
            // Calcular daño con multiplicadores
            let finalDamage = this.dmg * ItemEffects.getDamageMultiplier(towerTypes);

            // Crit check
            const isCrit = ItemEffects.rollCrit();
            if (isCrit) {
                finalDamage *= 2;
                bullet.setTint(0xffff00); // Amarillo para crits
            }

            // Debug: log cuando hay items activos
            if (GameState.inventory().length > 0) {
                console.log(`🛡️ Personaje dispara: base=${this.dmg} → final=${finalDamage.toFixed(1)} (x${ItemEffects.getDamageMultiplier(towerTypes).toFixed(2)}) ${isCrit ? '💥CRIT!' : ''}`);
            }

            // Offset Y (-40) para simular disparo desde "altura" o centro
            bullet.fire(this.x, this.y - 40, target, finalDamage);
        }
    }

    /**
     * Regenera el escudo del personaje al máximo (al inicio de cada oleada).
     */
    regenerateShield() {
        GameState.refillShield();
    }

    /**
     * Aplica daño al personaje.
     * Prioriza el escudo antes que la vida.
     * @param amount Cantidad de daño a recibir.
     */
    takeDamage(amount: number) {
        GameState.takeBaseDamage(amount);
    }
}
