import { GameObjects, Math as PhaserMath, Scene } from 'phaser';
import { Enemy } from './enemy';

/**
 * Objeto de Juego: Bala
 * 
 * Representa un proyectil disparado por un personaje.
 * Viaja hacia un objetivo específico.
 */
export class Bullet extends GameObjects.Image {
    speed: number;
    damage: number;
    target: Enemy | undefined;
    dx: number = 0;
    dy: number = 0;

    constructor(scene: Scene) {
        super(scene, 0, 0, 'bullet');
        this.speed = 1; // Píxeles por ms (aprox)
        this.damage = 0;
    }

    /**
     * Activa la bala y establece su trayectoria hacia el objetivo.
     * @param x Posición X inicial
     * @param y Posición Y inicial
     * @param target Enemigo objetivo
     * @param damage Daño al impactar
     */
    fire(x: number, y: number, target: Enemy, damage: number) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);

        this.target = target;
        this.damage = damage;
    }

    override update(time: number, delta: number) {
        // Si el objetivo está muerto o no existe, destruir bala
        if (!this.target || !this.target.active) {
            this.destroyBullet();
            return;
        }

        // Calcular Movimiento
        const angle = PhaserMath.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        const scaledDelta = delta * this.scene.time.timeScale;
        const moveDistance = this.speed * scaledDelta;

        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);

        this.x += this.dx * moveDistance;
        this.y += this.dy * moveDistance;

        // Detección de Impacto (Chequeo de distancia al cuadrado)
        // 20^2 = 400
        const distanceSq = PhaserMath.Distance.Squared(this.x, this.y, this.target.x, this.target.y);

        if (distanceSq < 400) {
            this.hitTarget();
        }
    }

    /**
     * Lógica al impactar el objetivo.
     */
    hitTarget() {
        if (this.target && this.target.active) {
            this.target.takeDamage(this.damage);
        }
        this.destroyBullet();
    }

    destroyBullet() {
        this.setActive(false);
        this.setVisible(false);
        this.destroy(); // En un juego completo, devolver al Pool
    }
}
