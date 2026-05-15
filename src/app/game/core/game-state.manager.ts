import { signal } from '@angular/core';

/**
 * Gestor del Estado del Juego (GameState Manager)
 * 
 * Clase estática que mantiene el estado global del juego (Oro, Vidas).
 * Utiliza Signals de Angular para proveer reactividad a la interfaz de usuario.
 * 
 * Se puede acceder directamente desde Escenas de Phaser o Componentes de Angular.
 */
export class GameState {
    // --- ESTADO REACTIVO (SIGNALS) ---
    static gold = signal(150);
    static lives = signal(100);
    static maxHealth = signal(100); // Vida máxima (afectada por items)
    static baseMaxHealth = signal(100); // Vida máxima base (sin items)
    static shield = signal(0); // Escudo actual
    static maxShield = signal(50); // Escudo máximo (afectado por items)
    static baseMaxShield = signal(50); // Escudo máximo base (sin items)
    static score = signal(0);
    static wave = signal(1);
    static isWaveActive = signal(false);
    static selectedWeapon = signal<{ type: string, cost: number } | null>(null);
    static selectedBoon = signal<string | null>(null); // Nombre del boon inicial
    
    // --- NUEVOS CAMPOS PARA RUNS ---
    static runId = signal<number | null>(null);
    static enemiesKilled = signal(0);
    static startTime = signal(0);
    static rewardPool = signal<any[]>([]);
    static isRewardPending = signal(false);
    static inventory = signal<any[]>([]); // Items adquiridos en la run


    /**
     * Resetea el estado del juego (Game Over / Reinicio).
     */
    static reset() {
        this.gold.set(150);
        this.lives.set(100);
        this.maxHealth.set(100);
        this.baseMaxHealth.set(100);
        this.score.set(0);
        this.wave.set(1);
        this.isWaveActive.set(false);
        this.shield.set(0);
        this.maxShield.set(50);
        this.baseMaxShield.set(50);
        this.selectedWeapon.set(null);
        this.selectedBoon.set(null);
        this.runId.set(null);
        this.enemiesKilled.set(0);
        this.startTime.set(0);
        this.rewardPool.set([]);
        this.isRewardPending.set(false);
        this.inventory.set([]);
    }

    /**
     * Actualiza la cantidad de oro del jugador.
     * @param amount Positivo para añadir, negativo para gastar.
     */
    static updateGold(amount: number) {
        this.gold.update(v => v + amount);
    }

    /**
     * Actualiza las vidas del jugador.
     * @param amount Positivo para curar, negativo para dañar.
     */
    static updateLives(amount: number) {
        this.lives.update(v => v + amount);
    }

    static updateScore(amount: number) {
        this.score.update(v => v + amount);
    }

    /**
     * Aplica daño a la base, priorizando el escudo.
     */
    static takeBaseDamage(amount: number) {
        const currentShield = this.shield();
        if (currentShield > 0) {
            const damageToShield = Math.min(currentShield, amount);
            this.shield.update(v => Math.max(0, v - damageToShield));

            const remainingDamage = amount - damageToShield;
            if (remainingDamage > 0) {
                this.lives.update(v => Math.max(0, v - remainingDamage));
            }
        } else {
            this.lives.update(v => Math.max(0, v - amount));
        }
    }

    static refillShield() {
        this.shield.set(this.maxShield());
    }

    // Removed duplicate updateScore


    static nextWave() {
        this.wave.update(val => val + 1);
    }


}
