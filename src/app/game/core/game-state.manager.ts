import { signal } from '@angular/core';

export class GameState {
    static gold = signal(150);
    static lives = signal(100);
    static maxHealth = signal(100);
    static baseMaxHealth = signal(100);
    static shield = signal(0);
    static maxShield = signal(50);
    static baseMaxShield = signal(50);
    static score = signal(0);
    static wave = signal(1);
    static isWaveActive = signal(false);
    static selectedWeapon = signal<{ type: string, cost: number } | null>(null);
    static selectedBoon = signal<string | null>(null);
    
    static runId = signal<number | null>(null);
    static enemiesKilled = signal(0);
    static startTime = signal(0);
    static rewardPool = signal<any[]>([]);
    static isRewardPending = signal(false);
    static inventory = signal<any[]>([]);

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

    static updateGold(amount: number) {
        this.gold.update(v => v + amount);
    }

    static updateLives(amount: number) {
        this.lives.update(v => v + amount);
    }

    static updateScore(amount: number) {
        this.score.update(v => v + amount);
    }

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

    static nextWave() {
        this.wave.update(val => val + 1);
    }
}
