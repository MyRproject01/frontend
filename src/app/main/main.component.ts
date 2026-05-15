import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerService, LeaderboardEntry } from '../services/player.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent implements OnInit {
  private playerService = inject(PlayerService);
  
  leaderboard = signal<LeaderboardEntry[]>([]);
  maxScore = signal<number>(1);
  
  userHighScore = signal<number | null>(null);
  userMaxWave = signal<number | null>(null);
  userRank = signal<number | string>('-');
  showUserFooter = signal<boolean>(false);

  ngOnInit() {
    this.playerService.getLeaderboard().subscribe({
      next: (data) => {
        console.log('🏆 Leaderboard Data:', data);
        if (data && data.length > 0) {
          const sorted = [...data].sort((a, b) => b.highScore - a.highScore);
          this.leaderboard.set(sorted.slice(0, 10)); // Top 10
          this.maxScore.set(sorted[0].highScore || 1);
          this.calculateUserRank(sorted);
        }
      },
      error: (err) => console.error('Failed to load leaderboard', err)
    });

    this.playerService.getStats().subscribe({
      next: (stats) => {
        this.userHighScore.set(stats.highScore);
        this.userMaxWave.set(stats.maxWave);
        this.calculateUserRank(this.leaderboard());
      },
      error: (err) => console.error('Failed to load user stats', err)
    });
  }

  private calculateUserRank(fullLeaderboard: LeaderboardEntry[]) {
    const score = this.userHighScore();
    if (score === null || fullLeaderboard.length === 0) return;
    
    // Si podemos encontrar la posición por puntuación (esto es aproximado si no tenemos el nombre de usuario exacto del JWT)
    const rankIndex = fullLeaderboard.findIndex(entry => entry.highScore <= score);
    if (rankIndex !== -1) {
      const rank = rankIndex + 1;
      this.userRank.set(rank);
      this.showUserFooter.set(rank > 10);
    } else {
      this.userRank.set(fullLeaderboard.length + 1);
      this.showUserFooter.set(true);
    }
  }
}
