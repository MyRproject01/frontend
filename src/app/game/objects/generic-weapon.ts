import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { Weapon } from './weapon';
import { DataManager } from '../core/data.manager';
import { ItemEffects } from '../core/item-effects.manager';

export class GenericWeapon extends Weapon {
    weaponId: string;

    private beamGraphics: Phaser.GameObjects.Graphics | null = null;
    private currentTarget: any = null;
    private rampUpTimer: number = 1;

    constructor(scene: Scene, x: number, y: number, weaponId: string) {
        // Determinamos la textura a usar. 
        const specialWeapons = ['pulse-turret', 'arc-railgun', 'plasma-cannon', 'neuro-laser-tower', 'quantum-obelisk'];
        const isSpecial = specialWeapons.includes(weaponId);
        
        const textureKey = isSpecial ? weaponId + '_sheet' : weaponId;
        super(scene, x, y, textureKey);
        
        this.weaponId = weaponId;
        
        // Buscar estadísticas en DataManager usando el weaponId
        const weapons = DataManager.data().weapons;
        const stats = weapons.find(w => w.id === weaponId);
        
        if (stats) {
            this.range = stats.range;
            this.damage = stats.dmg;
            this.cooldown = stats.cooldown;
        }

        // Si es una torre con spritesheet, empezamos en el frame 0 (Down-Left)
        if (isSpecial) {
            this.setFrame(0);
        }
    }

    override update(time: number, delta: number): void {
        if (this.weaponId === 'neuro-laser-tower') {
            this.updateLaser(delta);
        } else if (this.weaponId === 'quantum-obelisk') {
            this.updateObelisk(delta);
        } else {
            super.update(time, delta);
        }
    }

    private updateLaser(delta: number) {
        const mainScene = this.scene as any;
        const towerTypes = mainScene.getUniqueTowerTypeCount?.() || 0;
        const target = this.findTarget(towerTypes);

        if (target) {
            // Lógica de escalado de daño (Inferno Tower)
            if (this.currentTarget === target) {
                // Sube de x1 a x5 en unos 3 segundos
                this.rampUpTimer = Math.min(this.rampUpTimer + (delta / 1000) * 1.5, 5);
            } else {
                this.rampUpTimer = 1;
                this.currentTarget = target;
            }

            // Aplicar daño por tick
            const finalDamage = (this.damage * this.rampUpTimer * (delta / 1000));
            target.takeDamage(finalDamage);

            // Visual: Rayo rosa
            this.drawBeam(target, 0xff00ff, true);
            
            // Actualizar dirección del sprite
            const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
            this.setDiagonalFrame(angle);
        } else {
            this.currentTarget = null;
            this.rampUpTimer = 1;
            if (this.beamGraphics) this.beamGraphics.clear();
        }
    }

    private updateObelisk(delta: number) {
        const mainScene = this.scene as any;
        const towerTypes = mainScene.getUniqueTowerTypeCount?.() || 0;
        
        // Encontrar todos los enemigos en rango
        const targets = this.findAllTargetsInRange(towerTypes);
        
        if (targets.length > 0) {
            // Daño compartido: se divide entre el número de enemigos
            const damagePerTarget = (this.damage * (delta / 1000)) / targets.length;
            
            targets.forEach(target => {
                target.takeDamage(damagePerTarget);
            });

            // Visual: Rayos azules múltiples
            this.drawMultiBeam(targets);
            
            // Apuntar al más cercano solo visualmente
            const angle = Phaser.Math.Angle.Between(this.x, this.y, targets[0].x, targets[0].y);
            this.setDiagonalFrame(angle);
        } else {
            if (this.beamGraphics) this.beamGraphics.clear();
        }
    }

    private findAllTargetsInRange(towerTypes: number): any[] {
        const scene = this.scene as any;
        if (!scene.enemies) return [];

        const effectiveRange = this.range * ItemEffects.getRangeMultiplier(towerTypes);
        const targets: any[] = [];
        const rangeSq = effectiveRange * effectiveRange;

        scene.enemies.getChildren().forEach((enemy: any) => {
            if (enemy.active && enemy.visible) {
                const distSq = Phaser.Math.Distance.Squared(this.x, this.y, enemy.x, enemy.y);
                if (distSq <= rangeSq) {
                    targets.push(enemy);
                }
            }
        });

        // Ordenar por cercanía
        return targets.sort((a, b) => {
            const distA = Phaser.Math.Distance.Squared(this.x, this.y, a.x, a.y);
            const distB = Phaser.Math.Distance.Squared(this.x, this.y, b.x, b.y);
            return distA - distB;
        });
    }

    private drawBeam(target: any, color: number, useRampUp: boolean) {
        if (!this.beamGraphics) {
            this.beamGraphics = this.scene.add.graphics();
            this.beamGraphics.setDepth(this.depth + 1);
        }
        this.beamGraphics.clear();
        
        const thickness = useRampUp ? (1 + (this.rampUpTimer * 2)) : 4;
        
        this.beamGraphics.lineStyle(thickness + 6, color, 0.3);
        this.beamGraphics.lineBetween(this.x, this.y, target.x, target.y);
        
        this.beamGraphics.lineStyle(thickness, color, 0.8);
        this.beamGraphics.lineBetween(this.x, this.y, target.x, target.y);
        
        this.beamGraphics.lineStyle(thickness / 2, 0xffffff, 1);
        this.beamGraphics.lineBetween(this.x, this.y, target.x, target.y);
    }

    private drawMultiBeam(targets: any[]) {
        if (!this.beamGraphics) {
            this.beamGraphics = this.scene.add.graphics();
            this.beamGraphics.setDepth(this.depth + 1);
        }
        this.beamGraphics.clear();

        targets.forEach(target => {
            const color = 0x00ffff; // Azul Cian para el Obelisco
            const thickness = 3;

            this.beamGraphics!.lineStyle(thickness + 4, color, 0.2);
            this.beamGraphics!.lineBetween(this.x, this.y, target.x, target.y);
            
            this.beamGraphics!.lineStyle(thickness, color, 0.7);
            this.beamGraphics!.lineBetween(this.x, this.y, target.x, target.y);
            
            this.beamGraphics!.lineStyle(thickness / 2, 0xffffff, 0.9);
            this.beamGraphics!.lineBetween(this.x, this.y, target.x, target.y);
        });
    }

    private setDiagonalFrame(angle: number) {
        const deg = Phaser.Math.RadToDeg(angle);
        if (deg >= 0 && deg < 90) {
            this.setFrame(1); // Down-Right
        } else if (deg >= 90 && deg <= 180) {
            this.setFrame(0); // Down-Left
        } else if (deg >= -90 && deg < 0) {
            this.setFrame(3); // Up-Right
        } else {
            this.setFrame(2); // Up-Left
        }
        this.setRotation(0);
    }

    fire(target: any, time: number) {
        // El laser y el obelisco no usan la función fire tradicional de balas
        if (this.weaponId === 'neuro-laser-tower' || this.weaponId === 'quantum-obelisk') return;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const specialWeapons = ['pulse-turret', 'arc-railgun', 'plasma-cannon'];
        const isSpecial = specialWeapons.includes(this.weaponId);

        if (isSpecial) {
            this.setDiagonalFrame(angle);
        } else {
            this.setRotation(angle + Math.PI / 2);
        }

        const bulletTexture = isSpecial ? this.weaponId + '_bullet' : 'bullet';
        this.spawnBullet(target, bulletTexture, 0xffffff, 0.5);
    }
}
