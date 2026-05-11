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

    // 1. Personajes
    this.load.image('archer', 'characters/archer/archerSprite.png');
    this.load.image('raf', 'characters/raf/rafSprite.png');

    // 2. Elementos de la Base
    this.load.image('buho', 'pillars/buho/buhoPillar.png');
    this.load.image('tonya', 'pillars/Tonya/tonyaPillar.png');

    // 3. Torres (Iconos)
    this.load.image('cannon', 'icons/turrets/cannon.png');
    this.load.image('crossbow', 'icons/turrets/crossbow.png');
    this.load.image('tesla', 'icons/turrets/tesla.png');

    // 4. Fondos
    // (Cargado en MainScene)

    // 5. Pruebas / Animaciones
    // (Legacy removed) Enemy loading moved to MainScene

    this.load.on('loaderror', (file: any) => {
      console.error('Error loading asset:', file.key);
    });
  }

  async create() {
    // Generar textura para la bala de forma procedural (Bola Azul)
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x0088ff, 1); // Color: Azul Brillante
    graphics.fillCircle(10, 10, 8);  // Dibujar círculo: x, y, radio
    graphics.generateTexture('bullet', 20, 20); // Guardar como textura 'bullet' (20x20)

    // Cargar Datos de la API antes de iniciar el juego
    console.log("BootScene: Loading Game Data from API...");
    await DataManager.loadData();
    console.log("BootScene: Data Loaded. Starting MainScene.");

    // Iniciar la escena principal (La UI ahora es HTML/Angular)
    this.scene.start('MainScene');
    // this.scene.launch('UIScene'); // Deshabilitado, usamos UI de Angular
  }
}
