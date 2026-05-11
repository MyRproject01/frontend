import { GameObjects, Scene } from 'phaser';

export abstract class Weapon extends GameObjects.Sprite {
    range: number = 200;
    damage: number = 10;
    cooldown: number = 1000;
    fireTimer: number = 0;

    constructor(scene: Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        this.setDisplaySize(64, 64);
    }

    abstract fire(target: any, time: number): void;

    override update(time: number, delta: number): void {
        const scaledDelta = delta * this.scene.time.timeScale;

        // Comprobación de Cooldown
        this.fireTimer -= scaledDelta;
        if (this.fireTimer > 0) return;

        // Buscar Objetivo
        const target = this.findTarget();
        if (target) {
            this.fire(target, time);
            this.fireTimer = this.cooldown;
        }
    }

    /**
     * Busca el enemigo más cercano dentro del rango.
     * Optimizado usando distancia al cuadrado para evitar raíces cuadradas costosas.
     */
    findTarget(): any {
        const scene = this.scene as any; // Cast para acceder al grupo de enemigos
        if (!scene.enemies) return null;

        let closestEnemy: any = null;
        let minDistanceSq = this.range * this.range; // Usamos rango al cuadrado

        scene.enemies.children.each((enemy: any) => {
            if (enemy.active && enemy.visible) {
                // Distancia al cuadrado es más rápida que Math.sqrt
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
     * Método helper para disparar una bala básica.
     * Reduce código duplicado en subclases.
     */
    protected spawnBullet(target: any, texture: string = 'bullet', tint: number = 0xffffff, speed: number = 0.5) {
        const mainScene = this.scene as any;
        if (mainScene.bullets) {
            const bullet = mainScene.bullets.get();
            if (bullet) {
                bullet.setTexture(texture);
                bullet.setTint(tint);
                bullet.fire(this.x, this.y, target, this.damage);
                bullet.speed = speed;
            }
        }
    }
}
