import { Scene } from 'phaser';
import { DataManager } from '../core/data.manager';

export class BootScene extends Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBox = this.add.graphics();
    const barWidth = 320;
    const barHeight = 50;
    const barX = (width - barWidth) / 2;
    const barY = (height - barHeight) / 2;

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(barX, barY, barWidth, barHeight);

    const progressBar = this.add.graphics();

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(barX + 10, barY + 10, (barWidth - 20) * value, barHeight - 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    console.log("BootScene: Preloading icons as textures... [v3]");
    const data = DataManager.data();

    const char = data.character;
    if (char && char.id) {
        this.load.spritesheet(char.id + '_sheet', `characters/${char.id}-sheet.png`, { frameWidth: 1254, frameHeight: 1254 });
        this.load.image(char.id + '_bullet', `characters/${char.id}-bullet.png`);
    }

    data.weapons.forEach(w => {
        this.load.image(w.id + '_icon', `weapons/${w.id}-icon.png`);
        
        const specialWeapons = ['pulse-turret', 'arc-railgun', 'plasma-cannon', 'neuro-laser-tower', 'quantum-obelisk'];
        
        if (specialWeapons.includes(w.id)) {
            this.load.spritesheet(w.id + '_sheet', `weapons/${w.id}-sheet.png`, { frameWidth: 1254, frameHeight: 1254 });
            
            const beamWeapons = ['neuro-laser-tower', 'quantum-obelisk'];
            if (!beamWeapons.includes(w.id)) {
                this.load.image(w.id + '_bullet', `weapons/${w.id}-bullet.png`);
            }
        } else {
            this.load.image(w.id, `weapons/${w.id}.png`);
        }
    });

    data.enemies.forEach(e => {
        this.load.spritesheet(e.id + '_sheet', `enemies/${e.id}-sheet.png`, { frameWidth: 1254, frameHeight: 1254 });
    });

    this.load.audio('game-music', 'game-music.mp3');

    this.load.on('loaderror', (file: any) => {
      console.error('Error loading asset:', file.key);
    });
  }

  create() {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x0088ff, 1);
    graphics.fillCircle(10, 10, 8);
    graphics.generateTexture('bullet', 20, 20);

    console.log("BootScene: All assets and data ready. Starting MainScene.");

    this.scene.start('MainScene');
  }
}
