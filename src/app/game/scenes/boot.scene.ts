import { Scene } from 'phaser';
import { DataManager } from '../core/data.manager';

/**
 * Escena de Carga (BootScene)
 * 
 * Se encarga de precargar todos los recursos (imágenes, audios) antes de iniciar el juego.
 * Una vez completado, salta a la MainScene.
 */
export class BootScene extends Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // --- UI DE CARGA VISUAL ---
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fondo de la barra
    const progressBox = this.add.graphics();
    const barWidth = 320;
    const barHeight = 50;
    const barX = (width - barWidth) / 2;
    const barY = (height - barHeight) / 2;

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(barX, barY, barWidth, barHeight);

    // Barra de progreso
    const progressBar = this.add.graphics();

    // Texto de "Cargando..."
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Cargando...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    // Eventos de carga
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1); // Verde
      progressBar.fillRect(barX + 10, barY + 10, (barWidth - 20) * value, barHeight - 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // --- CARGA DE RECURSOS (ASSETS) ---
    console.log("BootScene: Preloading icons as textures... [v3]");
    const data = DataManager.data();

    // 1. Personaje Seleccionado (Icono como textura)
    const char = data.character;
    if (char && char.id) {
        this.load.image(char.id, `characters/${char.id}-icon.png`);
    }

    // 2. Torres (Iconos seleccionados para el juego y HUD)
    data.weapons.forEach(w => {
        // Usamos el icono como textura del HUD
        this.load.image(w.id + '_icon', `weapons/${w.id}-icon.png`);
        
        // Cargamos la textura in-game (si existe el archivo con el nombre del id)
        // Algunas torres tienen assets especiales (hojas de sprites y balas custom)
        const specialWeapons = ['pulse-turret', 'arc-railgun', 'plasma-cannon', 'neuro-laser-tower', 'quantum-obelisk'];
        
        if (specialWeapons.includes(w.id)) {
            this.load.spritesheet(w.id + '_sheet', `weapons/${w.id}-sheet.png`, { frameWidth: 1254, frameHeight: 1254 });
            this.load.image(w.id + '_bullet', `weapons/${w.id}-bullet.png`);
        } else {
            this.load.image(w.id, `weapons/${w.id}.png`);
        }
    });

    // 3. Enemigos (Iconos como textura)
    data.enemies.forEach(e => {
        this.load.image(e.id, `enemies/${e.id}-icon.png`);
    });

    this.load.on('loaderror', (file: any) => {
      console.error('Error loading asset:', file.key);
    });
  }

  create() {
    // Generar textura para la bala de forma procedural (Bola Azul)
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x0088ff, 1); // Color: Azul Brillante
    graphics.fillCircle(10, 10, 8);  // Dibujar círculo: x, y, radio
    graphics.generateTexture('bullet', 20, 20); // Guardar como textura 'bullet' (20x20)

    console.log("BootScene: All assets and data ready. Starting MainScene.");

    // Iniciar la escena principal
    this.scene.start('MainScene');
  }
}
