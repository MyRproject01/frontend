import * as Phaser from 'phaser';
import { Enemy } from '../objects/enemy';
import { Character } from '../objects/character';
import { Bullet } from '../objects/bullet';
import { GenericWeapon } from '../objects/generic-weapon';
import { GameState } from '../core/game-state.manager';
import { DataManager } from '../core/data.manager';
import { ItemEffects } from '../core/item-effects.manager';

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

    // Visualización de Zonas
    placementGraphics: Phaser.GameObjects.Graphics | undefined;
    private pathPoints: Phaser.Math.Vector2[] = [];
    private lastSelectedWeaponType: string | null = null;
    private lastGold: number = -1;

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
        this.placementGraphics = this.add.graphics();
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
        this.character = new Character(this, 1470, 140, characterStats.id + '_sheet', characterStats, this.bullets, this.enemies);
        this.character.setDisplaySize(110, 110);
        this.character.setVisible(true);

        // Inicializar Escudo y Vida base desde estadísticas del personaje
        GameState.baseMaxShield.set(characterStats.def);
        GameState.baseMaxHealth.set(characterStats.hp);
        GameState.maxShield.set(characterStats.def);
        GameState.maxHealth.set(characterStats.hp);
        GameState.lives.set(characterStats.hp);
        GameState.refillShield();

        GameState.isWaveActive.set(false);

        // Play background music
        if (this.cache.audio.exists('game-music') && !this.sound.get('game-music')) {
            this.sound.play('game-music', { loop: true, volume: 0.4 });
        }
    }

    // Flag to prevent multiple Game Over triggers
    isGameOver: boolean = false;

    override update(time: number, delta: number) {
        // Lógica de Game Over
        if (this.isGameOver) return;

        if (GameState.lives() <= 0) {
            // Pequeño retardo para que el jugador vea la barra de vida en 0
            this.time.delayedCall(500, () => {
                this.handleGameOver();
            });
            this.isGameOver = true; // Bloquear múltiples triggers
            return;
        }

        if (this.character) this.character.update(time, delta);

        // Lógica de Torres
        this.weapons?.getChildren().forEach((tower: any) => {
            if (tower.active) tower.update(time, delta);
        });

        // Lógica de Zonas y Torre Fantasma
        this.handlePlacementUI();
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
        this.path = this.add.path(300, 410);
        this.path.lineTo(480, 410);
        this.path.lineTo(480, 680);
        this.path.lineTo(750, 680);
        this.path.lineTo(750, 140);
        this.path.lineTo(1020, 140);
        this.path.lineTo(1020, 410);
        this.path.lineTo(1200, 410);
        this.path.lineTo(1200, 590)
        this.path.lineTo(1470, 590);
        this.path.lineTo(1470, 140);

        // Cachear puntos del camino para colisiones rápidas
        this.pathPoints = this.path.getPoints(100);


    }

    createAnimations() {
        const enemies = DataManager.data().enemies;
        enemies.forEach(e => {
            const animKey = e.id + '_walk';
            const textureKey = e.id + '_sheet';

            if (!this.anims.exists(animKey)) {
                this.anims.create({
                    key: animKey,
                    frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
                    frameRate: 10,
                    repeat: -1
                });
            }
        });
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

        // Emitir evento de Game Over con estadísticas para el backend
        const stats = {
            score: GameState.score(),
            waveReached: GameState.wave(),
            enemiesKilled: GameState.enemiesKilled(),
            timeSurvivedSec: Math.floor((Date.now() - GameState.startTime()) / 1000)
        };
        this.game.events.emit('game-over', stats);

        // No pausamos la escena completa (scene.pause) porque detendría los eventos de input
        // Solo hemos pausado las físicas y detenido el update con el flag isGameOver
    }

    /**
     * Gestiona la actualización de la UI de posicionamiento (Zonas).
     */
    handlePlacementUI() {
        const selected = GameState.selectedWeapon();
        const gold = GameState.gold();

        // Redibujar solo si cambia el arma seleccionada o el oro (que afecta a la disponibilidad)
        if (selected?.type !== this.lastSelectedWeaponType || gold !== this.lastGold) {
            this.lastSelectedWeaponType = selected?.type || null;
            this.lastGold = gold;
            this.drawPlacementZones();
        }
    }

    /**
     * Dibuja las zonas habilitadas para colocar torres.
     */
    drawPlacementZones() {
        if (!this.placementGraphics) return;
        this.placementGraphics.clear();

        const selected = GameState.selectedWeapon();
        if (!selected) {
            // Asegurarnos de limpiar rastro si no hay nada seleccionado
            this.lastSelectedWeaponType = null;
            return;
        }

        // Estilo de la zona
        this.placementGraphics.fillStyle(0x00ff00, 0.1);
        this.placementGraphics.lineStyle(1, 0x00ff00, 0.2);

        const cellSize = 64;
        const width = Number(this.game.config.width);
        const height = Number(this.game.config.height);

        // Iteramos por la rejilla para marcar slots libres
        for (let x = cellSize / 2; x < width; x += cellSize) {
            for (let y = cellSize / 2; y < height; y += cellSize) {
                if (this.canPlaceWeapon(x, y, selected.cost, false)) {
                    this.placementGraphics.strokeRect(x - 30, y - 30, 60, 60);
                    this.placementGraphics.fillRect(x - 30, y - 30, 60, 60);
                }
            }
        }
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
        // Comprobar fin de oleada
        if (GameState.isWaveActive() && this.remainingDifficulty <= 0 && this.enemies?.countActive() === 0) {
            this.endWave();
        }
    }

    canPlaceWeapon(x: number, y: number, cost: number, checkGold: boolean = true): boolean {
        // 1. Comprobar Oro
        if (checkGold && GameState.gold() < cost) return false;

        // 2. Comprobar Colisión con Camino
        // Usamos un radio de colisión de 40px para evitar que los cuadrados toquen el camino
        const collisionRadiusSq = 1600; // 40^2 = 1600

        if (this.pathPoints && this.pathPoints.length > 0) {
            for (const point of this.pathPoints) {
                const dx = x - point.x;
                const dy = y - point.y;
                const dSq = dx * dx + dy * dy;
                if (dSq < collisionRadiusSq) return false;
            }
        }

        // 3. Comprobar Superposición con otras Torres
        if (this.weapons) {
            const towers = this.weapons.getChildren();
            for (const tower of towers as any[]) {
                const dx = x - tower.x;
                const dy = y - tower.y;
                const dSq = dx * dx + dy * dy;
                if (dSq < 3600) return false; // 60^2 = 3600
            }
        }

        // 4. Comprobar Superposición con el Personaje (Defensor final)
        if (this.character) {
            const dx = x - this.character.x;
            const dy = y - this.character.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < 5000) return false; // Evitar poner torres encima del personaje
        }

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
            console.log("Placing tower at", snapX, snapY);

            // Deducir Oro
            GameState.updateGold(-selected.cost);

            // Crear Fábrica de Torres
            const tower = new GenericWeapon(this, snapX, snapY, selected.type);
            if (tower) {
                this.weapons?.add(tower);
            }

            // Resetear Selección y Limpiar UI
            GameState.selectedWeapon.set(null);
            this.drawPlacementZones();
            console.log("Tower placed successfully");
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

        // Recalcular shield y health con multiplicadores de items
        const towerTypes = this.getUniqueTowerTypeCount();
        const newMaxShield = Math.floor(GameState.baseMaxShield() * ItemEffects.getMaxShieldMultiplier(towerTypes));
        const newMaxHealth = Math.floor(GameState.baseMaxHealth() * ItemEffects.getMaxHealthMultiplier(towerTypes));
        GameState.maxShield.set(newMaxShield);
        GameState.maxHealth.set(newMaxHealth);

        // Ajustar vida actual si supera el nuevo máximo
        if (GameState.lives() > newMaxHealth) {
            GameState.lives.set(newMaxHealth);
        }

        this.character?.regenerateShield();
        console.log(`Starting Wave ${wave} with Difficulty ${this.currentWaveDifficulty} | Shield: ${newMaxShield} | MaxHP: ${newMaxHealth}`);
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
                GameState.enemiesKilled.update(v => v + 1);
            });
            enemy.setOnReachBase(() => {
                this.character?.takeDamage(enemy.damage);
            });

            this.remainingDifficulty -= enemyCost;
        }
    }

    endWave() {
        const wave = GameState.wave();
        console.log(`Wave ${wave} completed!`);
        GameState.isWaveActive.set(false);

        const reward = this.currentWaveDifficulty * 10;
        GameState.updateGold(reward);

        // Preparar siguiente
        GameState.nextWave();

        // Solicitar recompensas solo en rondas impares (1, 3, 5, 7...)
        if (wave % 2 !== 0) {
            console.log(`Ronda ${wave} (impar) - Emitting request-rewards event...`);
            this.game.events.emit('request-rewards');
        } else {
            console.log(`Round ${wave} (even) - No rewards.`);
        }
    }

    /**
     * Cuenta cuántos tipos de torres únicos hay en el mapa.
     * Usado por Synergy Core para calcular bonificaciones.
     */
    getUniqueTowerTypeCount(): number {
        if (!this.weapons) return 0;
        const types = new Set<string>();
        this.weapons.getChildren().forEach((tower: any) => {
            if (tower.active && tower.weaponId) {
                types.add(tower.weaponId);
            }
        });
        return types.size;
    }
}
