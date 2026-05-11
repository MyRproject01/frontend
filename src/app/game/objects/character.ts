import { Scene, GameObjects, Math as PhaserMath } from 'phaser';
import { Bullet } from './bullet';
import { Enemy } from './enemy';
import { GameState } from '../core/game-state.manager';

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

        // Cooldown en milisegundos
        const cooldown = 1000 / this.attackSpeed;

        // Comprobar Cooldown
        this.fireTimer -= scaledDelta;

        if (this.fireTimer <= 0) {
            const target = this.getClosestEnemy();

            // Disparar si hay un objetivo válido
            if (target) {
                this.shoot(target);
                this.fireTimer = cooldown;
            }
        }
    }

    /**
     * Busca al enemigo activo más cercano dentro del rango.
     * @returns El objeto enemigo o null.
     */
    getClosestEnemy(): Enemy | null {
        let closest: Enemy | null = null;
        let minDistanceSq = this.range * this.range; // Usar distancia al cuadrado

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
     * Genera (spawnea) una bala dirigida al enemigo.
     * @param target El enemigo al que disparar.
     */
    shoot(target: Enemy) {
        const bullet = this.bullets.get(this.x, this.y) as Bullet;
        if (bullet) {
            // Offset Y (-40) para simular disparo desde "altura" o centro
            bullet.fire(this.x, this.y - 40, target, this.dmg);
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
