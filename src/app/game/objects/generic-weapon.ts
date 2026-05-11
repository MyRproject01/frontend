import { Scene } from 'phaser';
import { Weapon } from './weapon';
import { DataManager } from '../core/data.manager';

export class GenericWeapon extends Weapon {
    weaponId: string;

    constructor(scene: Scene, x: number, y: number, weaponId: string) {
        // Usa el icono del arma (cargado previamente con la ID)
        super(scene, x, y, weaponId + '_icon');
        
        this.weaponId = weaponId;
        
        // Buscar estadísticas en DataManager usando el weaponId
        const weapons = DataManager.data().weapons;
        const stats = weapons.find(w => w.id === weaponId);
        
        if (stats) {
            this.range = stats.range;
            this.damage = stats.dmg;
            this.cooldown = stats.cooldown;
        }
    }

    fire(target: any, time: number) {
        // Rotar hacia el objetivo
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        this.setRotation(angle + Math.PI / 2);

        // Disparo genérico: podemos hacer que el color/velocidad varíe, pero para ahora es genérico
        this.spawnBullet(target, 'bullet', 0xffffff, 0.5);
    }
}
