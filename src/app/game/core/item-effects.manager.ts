import { GameState } from './game-state.manager';

/**
 * Item Effects Manager
 * 
 * Calcula multiplicadores de stats basados en el inventario del jugador.
 * Los efectos son MULTIPLICATIVOS entre sí (cada item multiplica sobre el anterior).
 * 
 * Items:
 *   1 - Resonance Amplifier: +10% Damage (x20% con sinergia Optic Array)
 *   2 - Optic Array: +15% Range, +2% Crit por stack
 *   3 - Rapid Battery Cell: +12% Attack Speed, 5% chance restaurar 1% Shield
 *   4 - Shield Overclocker: +5% max Shield, -10% max Health
 *   5 - Synergy Core: +5% ALL stats por tipo de torre único (max 3)
 */
export class ItemEffects {

    // --- Helpers ---

    /** Cuenta cuántas copias de un item tiene el jugador */
    static countItem(itemId: number): number {
        return GameState.inventory().filter(i => i.id === itemId).length;
    }

    /** Comprueba si el jugador tiene al menos uno de un item */
    static hasItem(itemId: number): boolean {
        return GameState.inventory().some(i => i.id === itemId);
    }

    // --- Multiplicadores (MULTIPLICATIVOS) ---

    /**
     * Multiplicador de Daño.
     * - Tonya Boon: +5% (1.05)
     * - Resonance Amplifier (id:1): ×1.10 por stack (×1.20 si tiene Optic Array)
     * - Synergy Core (id:5): ×1.05 por tipo de torre único
     */
    static getDamageMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        // Tonya Boon (+5% Damage)
        if (GameState.selectedBoon() === 'Tonya') {
            multiplier *= 1.05;
        }

        // Resonance Amplifier
        const ampCount = this.countItem(1);
        if (ampCount > 0) {
            const perStack = this.hasItem(2) ? 1.20 : 1.10; // Sinergia con Optic Array
            multiplier *= Math.pow(perStack, ampCount);
        }

        // Synergy Core
        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            const synergyPerCore = Math.pow(1.05, uniqueTowerTypes); // 1.05^towers por core
            multiplier *= Math.pow(synergyPerCore, synergyCount);
        }

        return multiplier;
    }

    /**
     * Multiplicador de Rango.
     * - Optic Array (id:2): ×1.15 por stack
     * - Synergy Core (id:5): ×1.05 por tipo de torre único
     */
    static getRangeMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        // Optic Array
        const opticCount = this.countItem(2);
        if (opticCount > 0) {
            multiplier *= Math.pow(1.15, opticCount);
        }

        // Synergy Core
        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            multiplier *= Math.pow(Math.pow(1.05, uniqueTowerTypes), synergyCount);
        }

        return multiplier;
    }

    /**
     * Multiplicador de Velocidad de Ataque.
     * - Bu Ho Boon: +5% (1.05)
     * - Rapid Battery Cell (id:3): ×1.12 por stack
     * - Synergy Core (id:5): ×1.05 por tipo de torre único
     */
    static getAttackSpeedMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        // Bu Ho Boon (+5% Attack Speed)
        if (GameState.selectedBoon() === 'Bu Ho') {
            multiplier *= 1.05;
        }

        // Rapid Battery Cell
        const rapidCount = this.countItem(3);
        if (rapidCount > 0) {
            multiplier *= Math.pow(1.12, rapidCount);
        }

        // Synergy Core
        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            multiplier *= Math.pow(Math.pow(1.05, uniqueTowerTypes), synergyCount);
        }

        return multiplier;
    }

    /**
     * Multiplicador de Escudo Máximo.
     * - Bu Ho Boon: -5% (0.95)
     * - Shield Overclocker (id:4): ×1.05 por stack
     * - Synergy Core (id:5): ×1.05 por tipo de torre único
     */
    static getMaxShieldMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        // Bu Ho Boon (-5% Shield)
        if (GameState.selectedBoon() === 'Bu Ho') {
            multiplier *= 0.95;
        }

        // Shield Overclocker
        const shieldCount = this.countItem(4);
        if (shieldCount > 0) {
            multiplier *= Math.pow(1.05, shieldCount);
        }

        // Synergy Core
        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            multiplier *= Math.pow(Math.pow(1.05, uniqueTowerTypes), synergyCount);
        }

        return multiplier;
    }

    /**
     * Multiplicador de Vida Máxima.
     * - Tonya Boon: -5% (0.95)
     * - Shield Overclocker (id:4): ×0.90 por stack (PENALIZACIÓN)
     * - Synergy Core (id:5): ×1.05 por tipo de torre único
     */
    static getMaxHealthMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        // Tonya Boon (-5% Health)
        if (GameState.selectedBoon() === 'Tonya') {
            multiplier *= 0.95;
        }

        // Shield Overclocker (reduce vida)
        const shieldCount = this.countItem(4);
        if (shieldCount > 0) {
            multiplier *= Math.pow(0.90, shieldCount);
        }

        // Synergy Core
        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            multiplier *= Math.pow(Math.pow(1.05, uniqueTowerTypes), synergyCount);
        }

        return multiplier;
    }

    /**
     * Probabilidad de Golpe Crítico (0 a 1).
     * - Optic Array (id:2): +0.02 por stack
     * Capped a 0.50 (50%)
     */
    static getCritChance(): number {
        const opticCount = this.countItem(2);
        return Math.min(opticCount * 0.02, 0.50);
    }

    /**
     * Calcula si un disparo es crítico.
     * Los críticos hacen ×2 daño.
     */
    static rollCrit(): boolean {
        const chance = this.getCritChance();
        return chance > 0 && Math.random() < chance;
    }

    /**
     * Rapid Battery Cell: 5% de chance por disparo de restaurar 1% del escudo máximo.
     * Solo activo si tiene al menos un Rapid Battery Cell (id:3).
     */
    static tryShieldRestore(): void {
        if (!this.hasItem(3)) return;
        if (Math.random() < 0.05) {
            const restoreAmount = Math.ceil(GameState.maxShield() * 0.01);
            const newShield = Math.min(GameState.shield() + restoreAmount, GameState.maxShield());
            GameState.shield.set(newShield);
        }
    }
}
