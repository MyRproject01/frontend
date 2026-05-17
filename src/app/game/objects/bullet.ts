import { GameObjects, Math as PhaserMath, Scene } from 'phaser';
import { Enemy } from './enemy';

export class Bullet extends GameObjects.Image {
    speed: number;
    damage: number;
    target: Enemy | undefined;
    dx: number = 0;
    dy: number = 0;

    constructor(scene: Scene) {
        super(scene, 0, 0, 'bullet');
        this.speed = 1;
        this.damage = 0;
    }

    fire(x: number, y: number, target: Enemy, damage: number) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);

        this.target = target;
        this.damage = damage;
    }

    override update(time: number, delta: number) {
        if (!this.target || !this.target.active) {
            this.destroyBullet();
            return;
        }

        const angle = PhaserMath.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        const scaledDelta = delta * this.scene.time.timeScale;
        const moveDistance = this.speed * scaledDelta;

        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);

        this.x += this.dx * moveDistance;
        this.y += this.dy * moveDistance;

        const distanceSq = PhaserMath.Distance.Squared(this.x, this.y, this.target.x, this.target.y);

        if (distanceSq < 400) {
            this.hitTarget();
        }
    }

    hitTarget() {
        if (this.target && this.target.active) {
            this.target.takeDamage(this.damage);
        }
        this.destroyBullet();
    }

    destroyBullet() {
        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }
}
