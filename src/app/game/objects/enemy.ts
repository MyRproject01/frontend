import * as Phaser from 'phaser';
import { GameObjects, Math as PhaserMath, Scene } from 'phaser';
import { DataManager } from '../core/data.manager';

/**
 * Objeto de Juego: Enemigo
 * 
 * Representa una unidad enemiga que sigue un camino definido.
 * - Estadísticas de vida y daño.
 * - Lógica de seguimiento de ruta (PathFollowing).
 * - Lógica de ataque al llegar a la base.
 */
export class Enemy extends GameObjects.Sprite {
    // Seguimiento de ruta
    follower: { t: number; vec: PhaserMath.Vector2 };
    path: Phaser.Curves.Path | undefined;

    // Estadísticas
    id: string;
    difficulty: number = 1;
    damage: number = 10;
    hp: number = 100;
    maxHp: number = 100;
    speed: number = 1 / 20000; // Incremento de t por ms (1/duración)

    // HP Bar
    hpBar: Phaser.GameObjects.Graphics;

    // Estado de Ataque
    isAttacking: boolean = false;
    timeSinceLastAttack: number = 0;

    // Callbacks
    onDeathCallback: (() => void) | undefined;
    onReachBaseCallback: (() => void) | undefined;

    constructor(scene: Scene) {
        super(scene, 0, 0, ''); // Sin textura inicial, se asigna en setup()

        // Generar ID único para depuración (debug)
        this.id = Math.random().toString(36).substr(2, 9);
        this.follower = { t: 0, vec: new PhaserMath.Vector2() };
        this.setDisplaySize(80, 80);

        // Stats serán cargados en setup()
        this.hpBar = scene.add.graphics();
    }

    setup(path: Phaser.Curves.Path, stats: any) {
        this.follower.t = 0;
        this.path = path;

        // Configurar Sprite y Stats
        const textureKey = stats.id + '_sheet';
        this.setTexture(textureKey);
        
        // Play animation if it exists
        const animKey = stats.id + '_walk';
        if (this.scene.anims.exists(animKey)) {
            this.play(animKey);
        }
        
        // Let's keep a consistent size for now, or you can add size to stats
        this.setDisplaySize(80, 80); 

        // Aplicar Stats
        this.damage = stats.damage;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;

        // Resetear vida y barra
        this.hpBar.setVisible(true);
        this.updateHealthBar(); // Dibujar inicial

        // Posición inicial
        this.path.getPoint(this.follower.t, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
    }

    override update(time: number, delta: number) {
        if (!this.path) return;

        // Compensar el timeScale global para que la animación sea constante relative a tiempo real
        if (this.anims && this.anims.isPlaying) {
            const globalTimeScale = this.scene.time.timeScale || 1;
            this.anims.timeScale = 1 / globalTimeScale;
        }

        // Optimización: NO redibujar la barra de vida cada frame.
        // Solo actualizar su posición para que siga al enemigo.
        this.updateHealthBarPosition();

        // --- LÓGICA DE MOVIMIENTO ---
        this.follower.t += this.speed * delta * this.scene.time.timeScale;

        // ¿Llegó al final del camino?
        if (this.follower.t >= 1) {
            this.follower.t = 1;
            this.attack(); // Daña la base
            this.die();    // Desaparece (Kamikaze)
        }

        // Actualizar posición
        this.path.getPoint(this.follower.t, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
    }

    /**
     * Mueve la barra de vida con el enemigo.
     */
    updateHealthBarPosition() {
        if (!this.hpBar) return;
        const width = 40;
        const yOffset = this.displayHeight / 2 + 10; // Ajuste dinámico según tamaño
        this.hpBar.x = this.x - width / 2;
        this.hpBar.y = this.y - yOffset;
    }

    /**
     * Redibuja la barra de vida. Solo llamar cuando cambie HP.
     */
    updateHealthBar() {
        if (!this.hpBar) return;

        const width = 40;
        const height = 6;

        // Limpiamos y dibujamos en coordenadas locales (0,0) del Graphics
        // Luego movemos el Graphics con updateHealthBarPosition
        this.hpBar.clear();

        // Fondo (Rojo)
        this.hpBar.fillStyle(0xff0000);
        this.hpBar.fillRect(0, 0, width, height);

        // Vida (Verde)
        this.hpBar.fillStyle(0x00ff00);
        const hpPercent = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        this.hpBar.fillRect(0, 0, width * hpPercent, height);

        this.updateHealthBarPosition();
    }

    /**
     * Activa la animación de ataque y el callback correspondiente.
     */
    attack() {
        if (this.onReachBaseCallback) {
            this.onReachBaseCallback();
        }

        // Animación de pulso (empujón visual)
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

    /**
     * Maneja la recepción de daño.
     * @param damage Cantidad de daño recibido.
     */
    takeDamage(damage: number) {
        this.hp -= damage;

        // Feedback Visual: Tinte Rojo
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.active) this.clearTint();
        });

        this.updateHealthBar(); // Actualizar barra VISUALMENTE

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

    /**
     * Lógica de muerte (callbacks y limpieza).
     */
    die() {
        if (this.active && this.onDeathCallback) {
            this.onDeathCallback();
        }

        if (this.hpBar) {
            this.hpBar.clear(); // Limpiar gráficos
            this.hpBar.destroy();
        }

        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }
}
