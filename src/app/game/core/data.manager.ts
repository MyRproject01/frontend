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
            
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const [charRes, enemiesRes, weaponsRes] = await Promise.all([
                fetch(`${environment.apiUrl}/characters`, { headers }),
                fetch(`${environment.apiUrl}/enemies`, { headers }),
                fetch(`${environment.apiUrl}/weapons`, { headers })
            ]);

            if (!charRes.ok || !enemiesRes.ok || !weaponsRes.ok) {
                throw new Error(`API Error: Characters ${charRes.status}, Enemies ${enemiesRes.status}, Weapons ${weaponsRes.status}`);
            }

            const charsApi = await charRes.json();
            const enemiesApi = await enemiesRes.json();
            const weaponsApi = await weaponsRes.json();

            // The Spring Boot API might return { content: [...] } for collections or directly an array
            const characterList = charsApi.content || (Array.isArray(charsApi) ? charsApi : []);
            const enemyList = enemiesApi.content || (Array.isArray(enemiesApi) ? enemiesApi : []);
            const weaponList = weaponsApi.content || (Array.isArray(weaponsApi) ? weaponsApi : []);

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
                        cost: w.price || 0,
                        dmg: w.damage,
                        range: Number(w.range) * 64,
                        cooldown: 1000 / Number(w.attackSpeed || w.attack_speed || 1),
                        icon: `/weapons/${id}-icon.png` // Añadimos / inicial y usamos -icon para el HUD
                    });
                });
            }

            this.data.set(newData);
            console.log("✅ DataManager: Data Successfully Mapped from API endpoints.");

        } catch (error) {
            console.warn("DataManager: Failed to load from API (using mock)", error);
            
            // Mock fallback data so the game doesn't break when backend is down
            const mockData: GameData = {
                character: { hp: 100, dmg: 10, def: 5, attackSpeed: 1, range: 100 },
                enemies: [
                    { id: 'slime', name: '[MOCK] Slime', hp: 50, reward: 10, speed: 1, damage: 5 },
                    { id: 'goblin', name: '[MOCK] Goblin', hp: 80, reward: 20, speed: 1.5, damage: 10 }
                ],
                weapons: [
                    { id: 'pulse-turret', name: '[MOCK] Pulse Turret', cost: 50, dmg: 20, range: 200, cooldown: 1000, icon: '/weapons/pulse-turret-icon.png' },
                    { id: 'arc-railgun', name: '[MOCK] Arc Railgun', cost: 75, dmg: 15, range: 300, cooldown: 500, icon: '/weapons/arc-railgun-icon.png' },
                    { id: 'plasma-cannon', name: '[MOCK] Plasma Cannon', cost: 120, dmg: 30, range: 150, cooldown: 800, icon: '/weapons/plasma-cannon-icon.png' }
                ]
            };
            this.data.set(mockData);
        }

        return this.data();
    }
}
