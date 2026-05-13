import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router'; // Import Router
import * as Phaser from 'phaser';
import { BootScene } from './scenes/boot.scene';
import { MainScene } from './scenes/main.scene';
import { UIScene } from './scenes/ui.scene';
import { GameState } from './core/game-state.manager';
import { DataManager } from './core/data.manager';

import { CommonModule } from '@angular/common'; // Importar CommonModule

@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.html',
  styleUrl: './game.css',
  imports: [CommonModule]
})
export class GameComponent implements AfterViewInit, OnDestroy {
  game: Phaser.Game | undefined;

  // Exponer GameState y DataManager al template
  protected GameState = GameState;
  protected DataManager = DataManager;

  constructor(private router: Router) { } // Inject Router

  /**
   * Inicializa el juego de Phaser después de que la vista de Angular esté lista.
   */
  ngAfterViewInit() {
    // Cargar datos ANTES de inicializar Phaser para que estén disponibles en el preload de las escenas
    DataManager.loadData().then(() => {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 1600,
        height: 900,
        parent: 'game-container',
        // Configuración de Escalado (Responsive)
        transparent: true,
        scale: {
          mode: Phaser.Scale.ENVELOP, // Llena el contenedor manteniendo aspecto (recorta si necesario)
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
          default: 'arcade',
          arcade: {
            debug: true // Útil para ver cajas de colisión (hitboxes) en desarrollo
          }
        },
        scene: [BootScene, MainScene, UIScene]
      };

      this.game = new Phaser.Game(config);

      // Listen for Exit Event from Phaser
      if (this.game) {
        this.game.events.on('exit-game', () => {
          GameState.reset();
          this.router.navigate(['/main']); // Navigate to Main Menu
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }

  togglePause() {
    if (!this.game) return;
    const scene = this.game.scene.getScene('MainScene');
    if (scene) {
      if (scene.scene.isPaused()) {
        scene.scene.resume();
        console.log('Juego Reanudado');
      } else {
        scene.scene.pause();
        console.log('Juego Pausado');
      }
    }
  }

  isFastForward = false;

  startWave() {
    if (!this.game) return;
    const scene = this.game.scene.getScene('MainScene') as MainScene;
    if (scene) {
      scene.startNextWave();
    }
  }

  toggleSpeed() {
    if (!this.game) return;
    this.isFastForward = !this.isFastForward;

    // Phaser Time Scale
    // 1.0 = Normal, 2.0 = x2 Speed
    // Note: In Phaser 3, setting time.timeScale affects the global clock rate.
    // > 1 makes time pass faster.
    this.game.scale.resize(1600, 900); // Trigger resize sometimes helps refresh

    // Changing the loop speed directly:
    // Actually, physics.world.timeScale works inversely usually, but let's try scene.time.timeScale
    const scene = this.game.scene.getScene('MainScene');
    if (scene) {
      scene.time.timeScale = this.isFastForward ? 2.0 : 1.0;
      // Also physics
      scene.physics.world.timeScale = this.isFastForward ? 2.0 : 1.0;
    }
  }

  selectWeapon(type: string, cost: number) {
    if (this.GameState.selectedWeapon()?.type === type) {
      this.GameState.selectedWeapon.set(null); // Deseleccionar
    } else {
      this.GameState.selectedWeapon.set({ type, cost }); // Seleccionar nueva
    }
  }
}
