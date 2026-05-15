import { Component, OnDestroy, AfterViewInit, inject } from '@angular/core';

import { Router } from '@angular/router';
import * as Phaser from 'phaser';
import { BootScene } from './scenes/boot.scene';
import { MainScene } from './scenes/main.scene';
import { UIScene } from './scenes/ui.scene';
import { GameState } from './core/game-state.manager';
import { DataManager } from './core/data.manager';
import { RunService, GameEndStats } from '../services/run.service';
import { CatalogService } from '../loadout/catalog.service';
import { BuildService } from '../services/build.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


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

  // Atajos para Signals (evita errores de compilación en template)
  protected gold = GameState.gold;
  protected lives = GameState.lives;
  protected maxHealth = GameState.maxHealth;
  protected shield = GameState.shield;
  protected maxShield = GameState.maxShield;
  protected score = GameState.score;
  protected wave = GameState.wave;
  protected isWaveActive = GameState.isWaveActive;
  protected rewardPool = GameState.rewardPool;
  protected isRewardPending = GameState.isRewardPending;
  protected inventory = GameState.inventory;

  private sanitizer = inject(DomSanitizer);

  constructor(
    private router: Router,
    private runService: RunService,
    private catalogService: CatalogService,
    private buildService: BuildService
  ) { }

  ngAfterViewInit() {
    // Reset GameState to ensure clean start (Energy = 150, Score = 0, etc.)
    GameState.reset();

    // Cargar datos ANTES de inicializar Phaser
    DataManager.loadData().then((data) => {
      // 1. Obtener Boon SELECCIONADO por el usuario
      const selectedBoon = this.buildService.selectedBoon();
      
      // 2. Si hay boon seleccionado, lo usamos. Si no, buscamos el primero desbloqueado como fallback
      if (selectedBoon) {
        GameState.selectedBoon.set(selectedBoon.name);
        this.startRun(data, selectedBoon.id);
      } else {
        this.catalogService.getUnlockedBoons().subscribe({
          next: (boons) => {
            const fallbackBoon = (boons && boons.length > 0) ? boons[0] : { id: 1, name: 'Tonya' };
            GameState.selectedBoon.set(fallbackBoon.name);
            this.startRun(data, fallbackBoon.id);
          },
          error: (err) => {
            console.warn("⚠️ Error al obtener Boons, intentando con ID 1", err);
            this.startRun(data, 1);
          }
        });
      }
    });
  }

  private startRun(data: any, boonId: number) {
    const startRequest = {
      characterId: data.character.apiId,
      initialBoonId: boonId,
      weaponIds: data.weapons.map((w: any) => Number(w.apiId))
    };

    console.log("📤 Enviando StartRunRequest:", JSON.stringify(startRequest, null, 2));

    this.runService.startRun(startRequest).subscribe({
      next: (run) => {
        if (run && run.runId) {
          GameState.runId.set(run.runId);
          GameState.startTime.set(Date.now());
          console.log(`🚀 Partida iniciada en backend con ID: ${run.runId}`);
        } else {
          console.warn("⚠️ El backend no devolvió un runId válido:", run);
        }
        this.initializePhaser();
      },
      error: (err) => {
        console.error("❌ Error al iniciar la Run en el backend:", err);
        console.warn("⚠️ Continuando en modo local. No habrá guardado ni recompensas.");
        this.initializePhaser();
      }
    });
  }

  private initializePhaser() {
    if (this.game) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1600,
      height: 900,
      parent: 'game-container',
      transparent: true,
      scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: true
        }
      },
      scene: [BootScene, MainScene, UIScene]
    };

    this.game = new Phaser.Game(config);

    // Listen for events from Phaser
    this.game.events.on('game-over', (stats: GameEndStats) => {
      const runId = GameState.runId();
      if (runId) {
        this.runService.endRun(runId, stats).subscribe({
          next: () => console.log("✅ Partida finalizada y registrada en backend."),
          error: (err) => console.error("❌ Error al finalizar partida en backend:", err)
        });
      }
    });

    this.game.events.on('request-rewards', () => {
      console.log("🔍 Evento 'request-rewards' recibido");
      this.requestRewardPool();
    });

    this.game.events.on('exit-game', () => {
      GameState.reset();
      this.router.navigate(['/main']);
    });
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }

  togglePause(forcePause?: boolean) {
    if (!this.game) return;
    const scene = this.game.scene.getScene('MainScene');
    if (scene) {
      const shouldPause = forcePause !== undefined ? forcePause : !scene.scene.isPaused();
      if (shouldPause) {
        scene.scene.pause();
        console.log('Juego Pausado');
      } else {
        scene.scene.resume();
        console.log('Juego Reanudado');
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

    const scene = this.game.scene.getScene('MainScene') as MainScene;
    if (scene) {
      scene.time.timeScale = this.isFastForward ? 2.0 : 1.0;
      scene.physics.world.timeScale = this.isFastForward ? 2.0 : 1.0;
    }
  }

  selectWeapon(type: string, cost: number) {
    if (this.GameState.selectedWeapon()?.type === type) {
      this.GameState.selectedWeapon.set(null);
    } else {
      this.GameState.selectedWeapon.set({ type, cost });
    }
  }

  requestRewardPool() {
    const runId = GameState.runId();
    if (!runId) {
      console.warn("⚠️ No hay runId activo.");
      return;
    }

    console.log(`🔍 Solicitando pool de Items para Run ${runId}...`);
    this.runService.getRewardPool(runId).subscribe({
      next: (rewards) => {
        console.log("🎁 Pool de recompensas recibido del servidor:", rewards);
        if (rewards && rewards.length > 0) {
          // Generar la URL del icono y descripción formateada
          const enrichedRewards = rewards.map(item => ({
            ...item,
            iconUrl: `/items/${item.name.toLowerCase().replace(/\s+/g, '-')}-icon.png`
          }));
          GameState.rewardPool.set(enrichedRewards);
          GameState.isRewardPending.set(true);
          this.togglePause(true);
        }
      },
      error: (err) => console.error("❌ Error al obtener recompensas:", err)
    });
  }

  chooseReward(item: any) {
    const runId = GameState.runId();
    if (!runId || !item) return;

    this.runService.chooseReward(runId, item.id).subscribe({
      next: () => {
        console.log(`🎁 Elegido: ${item.name}`);
        // Añadir al inventario local
        GameState.inventory.update(inv => [...inv, item]);
        
        GameState.isRewardPending.set(false);
        GameState.rewardPool.set([]);
        this.togglePause(false);
      },
      error: (err) => console.error("❌ Error al elegir:", err)
    });
  }

  formatDescription(desc: string | undefined): SafeHtml {
    if (!desc) return '';
    
    let formatted = desc.trim()
      .replace(/^[\s-]+/, '')
      .replace(/-?\s*(Effect:|Passive:|Synergy:|Sinergy:)/gi, '$1');
    
    formatted = formatted.replace(/(Effect:|Passive:|Synergy:|Sinergy:)/gi, '<br>- $1');
    formatted = formatted.replace(/^<br>/, '');
    
    if (formatted && !formatted.startsWith('-')) {
      formatted = '- ' + formatted;
    }
    
    formatted = formatted.replace(/(Effect:)/gi, '<span class="keyword-effect">$1</span>');
    formatted = formatted.replace(/(Passive:)/gi, '<span class="keyword-passive">$1</span>');
    formatted = formatted.replace(/(Synergy:|Sinergy:)/gi, '<span class="keyword-synergy">$1</span>');
    
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  getItemCount(itemId: number): number {
    return GameState.inventory().filter(i => i.id === itemId).length;
  }

  getGroupedInventory(): Array<{ id: number; name: string; iconUrl: string; count: number }> {
    const inv = GameState.inventory();
    const map = new Map<number, { id: number; name: string; iconUrl: string; count: number }>();
    for (const item of inv) {
      const existing = map.get(item.id);
      if (existing) {
        existing.count++;
      } else {
        map.set(item.id, {
          id: item.id,
          name: item.name,
          iconUrl: item.iconUrl || `/items/${item.name.toLowerCase().replace(/\s+/g, '-')}-icon.png`,
          count: 1
        });
      }
    }
    return Array.from(map.values());
  }

  getActiveBoonIcon(): string {
    const boonName = GameState.selectedBoon();
    if (!boonName) return '';
    const formattedName = boonName.toLowerCase().replace(/\s+/g, '-');
    return `/boons/${formattedName}-icon.png`;
  }

  getActiveBoonName(): string {
    return GameState.selectedBoon() || '';
  }
}
