import * as Phaser from 'phaser';
import { GameObjects, Math as PhaserMath, Scene } from 'phaser';

export class Enemy extends GameObjects.Sprite {
    follower: { t: number; vec: PhaserMath.Vector2 };
    path: Phaser.Curves.Path | undefined;

    id: string;
    difficulty: number = 1;
    damage: number = 10;
    hp: number = 100;
    maxHp: number = 100;
    speed: number = 1 / 20000;

    hpBar: Phaser.GameObjects.Graphics;

    isAttacking: boolean = false;
    timeSinceLastAttack: number = 0;

    onDeathCallback: (() => void) | undefined;
    onReachBaseCallback: (() => void) | undefined;

    constructor(scene: Scene) {
        super(scene, 0, 0, '');

        this.id = Math.random().toString(36).substr(2, 9);
        this.follower = { t: 0, vec: new PhaserMath.Vector2() };
        this.setDisplaySize(80, 80);

        this.hpBar = scene.add.graphics();
    }

    setup(path: Phaser.Curves.Path, stats: any) {
        this.follower.t = 0;
        this.path = path;

        const textureKey = stats.id + '_sheet';
        this.setTexture(textureKey);
        
        const animKey = stats.id + '_walk';
        if (this.scene.anims.exists(animKey)) {
            this.play(animKey);
        }
        
        this.setDisplaySize(80, 80); 

        this.damage = stats.damage;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;

        this.hpBar.setVisible(true);
        this.updateHealthBar();

        this.path.getPoint(this.follower.t, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
    }

    override update(time: number, delta: number) {
        if (!this.path) return;

        if (this.anims && this.anims.isPlaying) {
            const globalTimeScale = this.scene.time.timeScale || 1;
            this.anims.timeScale = 1 / globalTimeScale;
        }

        this.updateHealthBarPosition();

        this.follower.t += this.speed * delta * this.scene.time.timeScale;

        if (this.follower.t >= 1) {
            this.follower.t = 1;
            this.attack();
            this.die();
        }

        this.path.getPoint(this.follower.t, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
    }

    updateHealthBarPosition() {
        if (!this.hpBar) return;
        const width = 40;
        const yOffset = this.displayHeight / 2 + 10;
        this.hpBar.x = this.x - width / 2;
        this.hpBar.y = this.y - yOffset;
    }

    updateHealthBar() {
        if (!this.hpBar) return;

        const width = 40;
        const height = 6;

        this.hpBar.clear();

        this.hpBar.fillStyle(0xff0000);
        this.hpBar.fillRect(0, 0, width, height);

        this.hpBar.fillStyle(0x00ff00);
        const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        this.hpBar.fillRect(0, 0, width * hpPercent, height);

        this.updateHealthBarPosition();
    }

    attack() {
        if (this.onReachBaseCallback) {
            this.onReachBaseCallback();
        }

        const targetScale = this.scaleX * 1.2;
        this.scene.tweens.add({
            targets: this,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }

    takeDamage(damage: number) {
        this.hp -= damage;

        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.active) this.clearTint();
        });

        this.updateHealthBar();

        if (this.hp <= 0) {
            this.die();
        }
    }

    setOnDeath(callback: () => void) {
        this.onDeathCallback = callback;
    }

    setOnReachBase(callback: () => void) {
        this.onReachBaseCallback = callback;
    }

    die() {
        if (this.active && this.onDeathCallback) {
            this.onDeathCallback();
        }

        if (this.hpBar) {
            this.hpBar.clear();
            this.hpBar.destroy();
        }

        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }
}
