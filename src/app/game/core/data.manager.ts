import { signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface GameData {
    character: {
        id: string;
        apiId: number;
        hp: number;
        dmg: number;
        def: number;
        attackSpeed: number;
        range: number;
    };
    enemies: Array<{
        id: string;
        apiId: number;
        name: string;
        hp: number;
        damage: number;
        speed: number;
        reward: number;
    }>;
    weapons: Array<{
        id: string;
        apiId: number;
        name: string;
        cost: number;
        dmg: number;
        range: number;
        cooldown: number;
        icon: string;
    }>;
    boon: {
        id: number;
        name: string;
        passiveType: string;
        passiveValue: number;
    } | null;
}

export class DataManager {
    static data = signal<GameData>({
        character: { id: 'raf', apiId: 0, hp: 0, dmg: 0, def: 0, attackSpeed: 0, range: 0 },
        enemies: [],
        weapons: [],
        boon: null
    });

    static async loadData(): Promise<GameData> {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const [allCharRes, unlockedCharRes, enemiesRes, allWeaponsRes, unlockedWeaponsRes, allBoonsRes, unlockedBoonsRes] = await Promise.all([
                fetch(`${environment.apiUrl}/characters`, { headers }),
                fetch(`${environment.apiUrl}/player/unlocks/characters`, { headers }),
                fetch(`${environment.apiUrl}/enemies`, { headers }),
                fetch(`${environment.apiUrl}/weapons`, { headers }),
                fetch(`${environment.apiUrl}/player/unlocks/weapons`, { headers }),
                fetch(`${environment.apiUrl}/boons`, { headers }),
                fetch(`${environment.apiUrl}/player/unlocks/boons`, { headers })
            ]);

            if (!allCharRes.ok || !unlockedCharRes.ok || !enemiesRes.ok || !allWeaponsRes.ok || !unlockedWeaponsRes.ok || !allBoonsRes.ok || !unlockedBoonsRes.ok) {
                throw new Error("API response not OK");
            }

            const [allChars, unlockedCharIdsObj, enemyListObj, allWeapons, unlockedWeaponIdsObj, allBoons, unlockedBoonIdsObj] = await Promise.all([
                allCharRes.json(),
                unlockedCharRes.json(),
                enemiesRes.json(),
                allWeaponsRes.json(),
                unlockedWeaponsRes.json(),
                allBoonsRes.json(),
                unlockedBoonsRes.json()
            ]);

            const charList = allChars.content || allChars;
            const unlockedCharIds = unlockedCharIdsObj.content || unlockedCharIdsObj;
            const enemyList = enemyListObj.content || enemyListObj;
            const weaponList = allWeapons.content || allWeapons;
            const unlockedWeaponIds = unlockedWeaponIdsObj.content || unlockedWeaponIdsObj;
            const boonList = allBoons.content || allBoons;
            const unlockedBoonIds = unlockedBoonIdsObj.content || unlockedBoonIdsObj;

            const newData: GameData = { character: { ...this.data().character }, enemies: [], weapons: [], boon: null };

            const unlockedChars = charList.filter((c: any) => unlockedCharIds.includes(c.id));
            
            const savedBuild = localStorage.getItem(`last_build_${localStorage.getItem('username')}`);
            let selectedChar = null;
            if (savedBuild) {
                const build = JSON.parse(savedBuild);
                selectedChar = unlockedChars.find((c: any) => c.id === build.character?.id);
            }
            if (!selectedChar && unlockedChars.length > 0) {
                selectedChar = unlockedChars[0];
            }

            if (selectedChar) {
                newData.character = {
                    id: selectedChar.name.toLowerCase().replace(/ /g, '-'),
                    apiId: selectedChar.id,
                    hp: selectedChar.health || 100,
                    dmg: selectedChar.damage || 10,
                    def: selectedChar.shield || 0,
                    attackSpeed: Number(selectedChar.attackSpeed || selectedChar.attack_speed || 1),
                    range: Number(selectedChar.range || 100)
                };
            }

            if (Array.isArray(enemyList)) {
                enemyList.forEach((e: any) => {
                    const id = e.name.toLowerCase().replace(/ /g, '-');
                    newData.enemies.push({
                        id,
                        apiId: e.id || 0,
                        name: e.name,
                        hp: e.health,
                        damage: e.damage,
                        speed: Number(e.speed) / 20000,
                        reward: (e.difficulty || 1) * 10
                    });
                });
            }

            const unlockedWeaponItems = weaponList.filter((w: any) => unlockedWeaponIds.includes(w.id));
            
            let selectedWeapons: any[] = [];
            if (savedBuild) {
                const build = JSON.parse(savedBuild);
                if (build.weapons) {
                    selectedWeapons = build.weapons.filter((bw: any) => unlockedWeaponIds.includes(bw.id));
                }
            }
            
            if (selectedWeapons.length < 3) {
                const additional = unlockedWeaponItems.filter((uw: any) => !selectedWeapons.some((sw: any) => sw.id === uw.id));
                selectedWeapons = [...selectedWeapons, ...additional].slice(0, 3);
            }

            selectedWeapons.forEach((w: any) => {
                const id = w.name.toLowerCase().replace(/ /g, '-');
                newData.weapons.push({
                    id,
                    apiId: w.id,
                    name: w.name,
                    cost: w.price || 0,
                    dmg: w.damage || 0,
                    range: Number(w.range || 100) * 64,
                    cooldown: 1000 / Number(w.attackSpeed || w.attack_speed || 1),
                    icon: `/weapons/${id}-icon.png` 
                });
            });
            newData.weapons.sort((a, b) => a.cost - b.cost);

            const unlockedBoons = boonList.filter((b: any) => unlockedBoonIds.includes(b.id));
            let selectedBoon = null;
            if (savedBuild) {
                const build = JSON.parse(savedBuild);
                selectedBoon = unlockedBoons.find((b: any) => b.id === build.boon?.id);
            }
            if (!selectedBoon && unlockedBoons.length > 0) {
                selectedBoon = unlockedBoons[0];
            }

            if (selectedBoon) {
                newData.boon = {
                    id: selectedBoon.id,
                    name: selectedBoon.name,
                    passiveType: selectedBoon.passiveType || selectedBoon.passive_type || 'none',
                    passiveValue: Number(selectedBoon.passiveValue || selectedBoon.passive_value || 0)
                };
                
                if (newData.boon.passiveType === 'hp_boost') {
                    newData.character.hp += newData.boon.passiveValue;
                } else if (newData.boon.passiveType === 'dmg_boost') {
                    newData.character.dmg += newData.boon.passiveValue;
                }
            }

            this.data.set(newData);
            console.log("✅ DataManager: Data Successfully Mapped and Filtered.");
            return newData;

        } catch (error) {
            console.warn("DataManager: Failed to load from API (using mock)", error);
            
            const mockData: GameData = {
                character: { id: 'raf', apiId: 1, hp: 100, dmg: 10, def: 5, attackSpeed: 1, range: 100 },
                enemies: [
                    { id: 'drone', apiId: 1, name: '[MOCK] Drone', hp: 50, reward: 10, speed: 1, damage: 5 },
                    { id: 'bot', apiId: 2, name: '[MOCK] Bot', hp: 80, reward: 20, speed: 1.5, damage: 10 }
                ],
                weapons: [
                    { id: 'pulse-turret', apiId: 1, name: '[MOCK] Pulse Turret', cost: 50, dmg: 20, range: 200, cooldown: 1000, icon: '/weapons/pulse-turret-icon.png' },
                    { id: 'arc-railgun', apiId: 2, name: '[MOCK] Arc Railgun', cost: 75, dmg: 15, range: 300, cooldown: 500, icon: '/weapons/arc-railgun-icon.png' },
                    { id: 'plasma-cannon', apiId: 3, name: '[MOCK] Plasma Cannon', cost: 120, dmg: 30, range: 150, cooldown: 800, icon: '/weapons/plasma-cannon-icon.png' }
                ],
                boon: null
            };
            this.data.set(mockData);
            return mockData;
        }
    }
}
