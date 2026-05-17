import { GameState } from './game-state.manager';

export class ItemEffects {

    static countItem(itemId: number): number {
        return GameState.inventory().filter(i => i.id === itemId).length;
    }

    static hasItem(itemId: number): boolean {
        return GameState.inventory().some(i => i.id === itemId);
    }

    static getDamageMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        if (GameState.selectedBoon() === 'Tonya') {
            multiplier *= 1.05;
        }

        const ampCount = this.countItem(1);
        if (ampCount > 0) {
            const perStack = this.hasItem(2) ? 1.20 : 1.10;
            multiplier *= Math.pow(perStack, ampCount);
        }

        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            const synergyPerCore = Math.pow(1.05, uniqueTowerTypes);
            multiplier *= Math.pow(synergyPerCore, synergyCount);
        }

        return multiplier;
    }

    static getRangeMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        const opticCount = this.countItem(2);
        if (opticCount > 0) {
            multiplier *= Math.pow(1.15, opticCount);
        }

        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            multiplier *= Math.pow(Math.pow(1.05, uniqueTowerTypes), synergyCount);
        }

        return multiplier;
    }

    static getAttackSpeedMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        if (GameState.selectedBoon() === 'Bu Ho') {
            multiplier *= 1.05;
        }

        const rapidCount = this.countItem(3);
        if (rapidCount > 0) {
            multiplier *= Math.pow(1.12, rapidCount);
        }

        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            multiplier *= Math.pow(Math.pow(1.05, uniqueTowerTypes), synergyCount);
        }

        return multiplier;
    }

    static getMaxShieldMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        if (GameState.selectedBoon() === 'Bu Ho') {
            multiplier *= 0.95;
        }

        const shieldCount = this.countItem(4);
        if (shieldCount > 0) {
            multiplier *= Math.pow(1.05, shieldCount);
        }

        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            multiplier *= Math.pow(Math.pow(1.05, uniqueTowerTypes), synergyCount);
        }

        return multiplier;
    }

    static getMaxHealthMultiplier(uniqueTowerTypes: number): number {
        let multiplier = 1;

        if (GameState.selectedBoon() === 'Tonya') {
            multiplier *= 0.95;
        }

        const shieldCount = this.countItem(4);
        if (shieldCount > 0) {
            multiplier *= Math.pow(0.90, shieldCount);
        }

        const synergyCount = this.countItem(5);
        if (synergyCount > 0 && uniqueTowerTypes > 0) {
            multiplier *= Math.pow(Math.pow(1.05, uniqueTowerTypes), synergyCount);
        }

        return multiplier;
    }

    static getCritChance(): number {
        const opticCount = this.countItem(2);
        return Math.min(opticCount * 0.02, 0.50);
    }

    static rollCrit(): boolean {
        const chance = this.getCritChance();
        return chance > 0 && Math.random() < chance;
    }

    static tryShieldRestore(): void {
        if (!this.hasItem(3)) return;
        if (Math.random() < 0.05) {
            const restoreAmount = Math.ceil(GameState.maxShield() * 0.01);
            const newShield = Math.min(GameState.shield() + restoreAmount, GameState.maxShield());
            GameState.shield.set(newShield);
        }
    }
}
