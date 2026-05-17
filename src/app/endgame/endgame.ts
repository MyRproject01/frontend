import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameState } from '../game/core/game-state.manager';
import { BuildService } from '../services/build.service';

@Component({
  selector: 'app-endgame',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './endgame.html',
  styleUrl: './endgame.css',
})
export class Endgame implements OnInit {
  private router = inject(Router);
  private buildService = inject(BuildService);

  // Stats captured from GameState
  finalScore = signal(0);
  finalWave = signal(0);
  enemiesKilled = signal(0);
  timeSurvivedSec = signal(0);

  // Character info
  characterName = signal('');
  characterSplashUrl = signal('');

  // Items collected during the run
  collectedItems = signal<Array<{ id: number; name: string; iconUrl: string; count: number }>>([]);

  // Boon used
  boonName = signal('');
  boonIconUrl = signal('');

  // Animation control
  isRevealed = signal(false);

  ngOnInit() {
    // Capture data from GameState before it resets
    this.finalScore.set(GameState.score());
    this.finalWave.set(GameState.wave());
    this.enemiesKilled.set(GameState.enemiesKilled());

    const elapsed = GameState.startTime() > 0
      ? Math.floor((Date.now() - GameState.startTime()) / 1000)
      : 0;
    this.timeSurvivedSec.set(elapsed);

    // Character splash
    const character = this.buildService.selectedCharacter();
    if (character) {
      this.characterName.set(character.name);
      const formatted = character.name.toLowerCase().replace(/\s+/g, '-');
      this.characterSplashUrl.set(`/characters/${formatted}.png`);
    }

    // Boon
    const boonNameVal = GameState.selectedBoon();
    if (boonNameVal) {
      this.boonName.set(boonNameVal);
      const formatted = boonNameVal.toLowerCase().replace(/\s+/g, '-');
      this.boonIconUrl.set(`/boons/${formatted}-icon.png`);
    }

    // Grouped inventory items
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
    this.collectedItems.set(Array.from(map.values()));

    // Trigger reveal animation after a short delay
    setTimeout(() => this.isRevealed.set(true), 100);
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  goToMain() {
    GameState.reset();
    this.router.navigate(['/main']);
  }

  playAgain() {
    GameState.reset();
    this.router.navigate(['/build-selector']);
  }
}
