import * as Phaser from 'phaser';
import { Enemy } from '../objects/enemy';
import { Character } from '../objects/character';
import { Bullet } from '../objects/bullet';
import { GenericWeapon } from '../objects/generic-weapon';
import { GameState } from '../core/game-state.manager';
import { DataManager } from '../core/data.manager';

/**
 * Escena Principal (MainScene)
 * 
 * Contiene la lógica principal del juego:
 * - Dibujado del mapa y camino.
 * - Gestión de oleadas de enemigos.
 * - Colocación y lógica de personajes (defensores).
 * - Control de colisiones y eventos.
 */
export class MainScene extends Phaser.Scene {
    // --- VARIABLES DE CLASE ---
    graphics: Phaser.GameObjects.Graphics | undefined;
    path: Phaser.Curves.Path | undefined;

    // Grupos de Objetos (Pooling para rendimiento)
    enemies: Phaser.GameObjects.Group | undefined;
    bullets: Phaser.GameObjects.Group | undefined;
    weapons: Phaser.GameObjects.Group | undefined; // Grupo de torres (weapons)

    // Torre Fantasma (Previsualización)
    ghost: Phaser.GameObjects.Sprite | undefined;
    ghostRange: Phaser.GameObjects.Arc | undefined; // Círculo de rango

    // Referencia a nuestro Personaje ("Character")
    character: Character | undefined;

    // Control de oleadas
    spawnTimer: number = 0;
    spawnInterval: number = 1500; // 1.5 segundos fijo

    // Lógica de Dificultad de Oleada
    currentWaveDifficulty: number = 0;
    remainingDifficulty: number = 0;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
    }

    create() {
        // --- CONFIGURACIÓN ESCENARIO ---
        // this.add.image(800, 450, 'bg').setDisplaySize(1600, 900);

        this.graphics = this.add.graphics();
        this.createPath();

        // Grupos
        this.enemies = this.add.group({ classType: Enemy, runChildUpdate: true });
        this.bullets = this.add.group({ classType: Bullet, runChildUpdate: true });
        this.weapons = this.add.group({ runChildUpdate: true });

        // Inicialización de Torre Fantasma (Oculta inicialmente)
        const firstWeapon = DataManager.data().weapons[0];
        const ghostKey = firstWeapon ? firstWeapon.id + '_icon' : '';
        this.ghost = this.add.sprite(0, 0, ghostKey).setAlpha(0.6).setVisible(false).setDisplaySize(64, 64);
        this.ghostRange = this.add.circle(0, 0, 200, 0x00ff00, 0.2).setVisible(false);

        // Escucha de Entrada para Colocación
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.tryPlaceWeapon(pointer.x, pointer.y);
            }
        });

        // Animaciones de Enemigos
        this.createAnimations();

        // Personaje (Defensor)
        const characterStats = DataManager.data().character;
        this.character = new Character(this, 230, 430, characterStats.id, characterStats, this.bullets, this.enemies);
        this.character.setDisplaySize(160, 160);
        this.character.setVisible(false);

        // Inicializar Escudo
        GameState.maxShield.set(characterStats.def);
        GameState.refillShield();

        GameState.isWaveActive.set(false);
    }

    // Flag to prevent multiple Game Over triggers
    isGameOver: boolean = false;

    override update(time: number, delta: number) {
        // Lógica de Game Over
        if (this.isGameOver) return;

        if (GameState.lives() <= 0) {
            this.handleGameOver();
            return;
        }

        if (this.character) this.character.update(time, delta);

        // Lógica de Torre Fantasma
        this.handleGhostTower();

        // Lógica de Oleada
        if (GameState.isWaveActive()) {
            this.handleWaveLogic(delta);
        }
    }

    /**
     * Crea el camino (Path) que seguirán los enemigos.
     */
    createPath() {
        this.path = this.add.path(170, 440);
        this.path.lineTo(350, 440);
        this.path.lineTo(350, 710);
        this.path.lineTo(620, 710);
        this.path.lineTo(620, 160);
        this.path.lineTo(890, 160);
        this.path.lineTo(890, 440);
        this.path.lineTo(1075, 440);
        this.path.lineTo(1075, 620)
        this.path.lineTo(1345, 620);
        this.path.lineTo(1345, 160);
    }

    createAnimations() {
        // Animaciones desactivadas temporalmente para usar iconos estáticos
        /*
        const enemies = DataManager.data().enemies;
        enemies.forEach(e => {
            const animKey = e.id + '_walk';
            if (!this.anims.exists(animKey)) {
                this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers(e.id, { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
            }
        });
        */
    }

    /**
     * Maneja la pantalla y lógica de Game Over.
     */
    handleGameOver() {
        this.isGameOver = true;
        this.physics.pause();
        const cam = this.cameras.main;

        // Texto Game Over
        this.add.text(cam.width / 2, cam.height / 2 - 50, 'GAME OVER', {
            fontSize: '84px',
            color: '#ff0000',
            fontFamily: '"Space Grotesk"',
            fontStyle: '900',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Botón BACK TO MENU
        const btn = this.add.text(cam.width / 2, cam.height / 2 + 80, 'BACK TO MENU', {
            fontSize: '28px',
            color: '#00373a',
            backgroundColor: '#00f3ff',
            fontFamily: '"Space Grotesk"',
            fontStyle: '700',
            padding: { x: 30, y: 15 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                console.log('Button Clicked: Exit Game');
                this.game.events.emit('exit-game');
            });

        // No pausamos la escena completa (scene.pause) porque detendría los eventos de input
        // Solo hemos pausado las físicas y detenido el update con el flag isGameOver
    }

    /**
     * Maneja la lógica de la torre fantasma (previsualización de colocación).
     */
    handleGhostTower() {
        const selected = GameState.selectedWeapon();
        if (selected && this.ghost && this.ghostRange) {
            const worldPoint = this.input.activePointer.position;

            // Ajuste a Rejilla (64x64)
            const snapX = Math.floor(worldPoint.x / 64) * 64 + 32;
            const snapY = Math.floor(worldPoint.y / 64) * 64 + 32;

            this.ghost.setPosition(snapX, snapY).setVisible(true);
            this.ghostRange.setPosition(snapX, snapY).setVisible(true);

            // Torre Fantasma genérica
            if (this.ghost?.texture.key !== selected.type + '_icon') {
                this.ghost?.setTexture(selected.type + '_icon');
            }

            // Validar Colocación
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

    /**
     * Maneja la lógica de spawneo de enemigos durante una oleada.
     */
    handleWaveLogic(delta: number) {
        const scaledDelta = delta * this.time.timeScale;
        this.spawnTimer += scaledDelta;

        if (this.remainingDifficulty > 0 && this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemy();
            this.spawnTimer -= this.spawnInterval;
        }
        if (this.remainingDifficulty <= 0 && this.enemies?.countActive() === 0) {
            this.endWave();
        }
    }

    canPlaceWeapon(x: number, y: number, cost: number): boolean {
        // 1. Comprobar Oro
        if (GameState.gold() < cost) return false;

        // 2. Comprobar Colisión con Camino
        const p = new Phaser.Math.Vector2(x, y);

        // Comprobar distancia a puntos del camino (simplificado)
        const pathPoints = this.path?.getPoints(50) || [];
        for (const point of pathPoints) {
            const d = p.distance(point);
            if (d < 40) return false; // Demasiado cerca del camino
        }

        // 3. Comprobar Superposición con otras Torres
        let overlap = false;
        this.weapons?.getChildren().forEach((tower: any) => {
            if (p.distance(new Phaser.Math.Vector2(tower.x, tower.y)) < 60) {
                overlap = true;
            }
            return true;
        });
        if (overlap) return false;

        return true;
    }

    tryPlaceWeapon(x: number, y: number) {
        const selected = GameState.selectedWeapon();
        if (!selected) return;

        // Ajuste a Rejilla
        const snapX = Math.floor(x / 64) * 64 + 32;
        const snapY = Math.floor(y / 64) * 64 + 32;

        if (this.canPlaceWeapon(snapX, snapY, selected.cost)) {
            // Colocar torre
            console.log("Colocando torre en", snapX, snapY);

            // Deducir Oro
            GameState.updateGold(-selected.cost);

            // Crear Fábrica de Torres
            const tower = new GenericWeapon(this, snapX, snapY, selected.type);

            if (tower) {
                this.weapons?.add(tower);
            }

            // Resetear Selección
            GameState.selectedWeapon.set(null);
        }
    }

    startNextWave() {
        if (GameState.isWaveActive()) return;

        const wave = GameState.wave();
        // Cálculo de dificultad: 10 * (1.5 ^ (wave - 1))
        this.currentWaveDifficulty = Math.floor(10 * Math.pow(1.5, wave - 1));
        this.remainingDifficulty = this.currentWaveDifficulty;

        GameState.isWaveActive.set(true);
        this.spawnTimer = 0; // Resetear timer
        this.character?.regenerateShield();
        console.log(`Iniciando Oleada ${wave} con Dificultad ${this.currentWaveDifficulty}`);
    }

    spawnEnemy() {
        const enemiesData = DataManager.data().enemies;
        if (!enemiesData || enemiesData.length === 0) return;

        // Dificultad aleatoria 1-3, limitada por la dificultad restante
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

            // Callbacks
            enemy.setOnDeath(() => {
                GameState.updateGold(enemyStats.reward);
                GameState.updateScore(enemyStats.reward * 10);
            });
            enemy.setOnReachBase(() => {
                this.character?.takeDamage(enemy.damage);
            });

            this.remainingDifficulty -= enemyCost;
        }
    }

    endWave() {
        GameState.isWaveActive.set(false);

        // Recompensa: Dificultad * 10
        const reward = this.currentWaveDifficulty * 10;
        GameState.updateGold(reward);
        console.log(`Oleada Completada! Recompensa: ${reward}`);

        // Preparar siguiente
        GameState.nextWave();
    }
}
