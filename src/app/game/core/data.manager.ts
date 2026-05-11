import { signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface GameData {
    character: {
        hp: number;
        dmg: number;
        def: number;
        attackSpeed: number;
        range: number;
    };
    enemies: {
        id: string;
        name: string;
        hp: number;
        reward: number;
        speed: number;
        damage: number;
    }[];
    weapons: {
        id: string;
        name: string;
        cost: number;
        dmg: number;
        range: number;
        cooldown: number;
        icon: string;
    }[];
}

export class DataManager {
    static data = signal<GameData>({
        character: { hp: 0, dmg: 0, def: 0, attackSpeed: 0, range: 0 },
        enemies: [],
        weapons: []
    });

    /**
     * Initializes data by attempting to fetch from API, falling back to mock.
     */
    static async loadData() {
        try {
            console.log(`DataManager: Fetching data from ${environment.apiUrl}`);
            
            const [charRes, enemiesRes, weaponsRes] = await Promise.all([
                fetch(`${environment.apiUrl}/characters`),
                fetch(`${environment.apiUrl}/enemies`),
                fetch(`${environment.apiUrl}/weapons`)
            ]);

            if (!charRes.ok || !enemiesRes.ok || !weaponsRes.ok) {
                throw new Error(`API Error: Characters ${charRes.status}, Enemies ${enemiesRes.status}, Weapons ${weaponsRes.status}`);
            }

            const charsApi = await charRes.json();
            const enemiesApi = await enemiesRes.json();
            const weaponsApi = await weaponsRes.json();

            // The Spring Boot API strictly returns { content: [...] } for collections
            const characterList = charsApi.content || [];
            const enemyList = enemiesApi.content || [];
            const weaponList = weaponsApi.content || [];

            // Get current default data (mock)
            const newData: GameData = { character: { hp: 0, dmg: 0, def: 0, attackSpeed: 0, range: 0 }, enemies: [], weapons: [] };

            // 1. Map Character (Take first)
            const rafData = Array.isArray(characterList) && characterList.length > 0 ? characterList[0] : null;

            if (rafData) {
                newData.character = {
                    hp: rafData.health,
                    dmg: rafData.damage,
                    def: rafData.shield,
                    attackSpeed: Number(rafData.attackSpeed || rafData.attack_speed || 1),
                    range: Number(rafData.range || 100)
                };
            }

            // 2. Map Enemies directly from Angular names
            if (Array.isArray(enemyList)) {
                enemyList.forEach((e: any) => {
                    const id = e.name.toLowerCase().replace(/ /g, '-');
                    newData.enemies.push({
                        id,
                        name: e.name,
                        hp: e.health,
                        damage: e.damage,
                        speed: Number(e.speed) / 20000,
                        reward: e.difficulty * 10
                    });
                });
            }

            // 3. Map Weapons (Take only first 3)
            if (Array.isArray(weaponList)) {
                weaponList.slice(0, 3).forEach((w: any) => {
                    const id = w.name.toLowerCase().replace(/ /g, '-');
                    newData.weapons.push({
                        id,
                        name: w.name,
                        cost: w.price,
                        dmg: w.damage,
                        range: Number(w.range) * 64,
                        cooldown: 1000 / Number(w.attackSpeed || w.attack_speed || 1),
                        icon: `weapons/${id}.png` // Se mapea el icono directo desde public/weapons/
                    });
                });
            }

            this.data.set(newData);
            console.log("✅ DataManager: Data Successfully Mapped from API endpoints.");

        } catch (error) {
            console.warn("DataManager: Failed to load from API (using mock)", error);
        }

        return this.data();
    }
}
