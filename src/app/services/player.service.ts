import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LeaderboardEntry {
  username: string;
  highScore: number;
  maxWave: number;
}

export interface PlayerStats {
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  maxWave: number;
  enemiesKilled: number;
  totalTimeSec: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/player`;

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.apiUrl}/stats/leaderboard`);
  }

  getStats(): Observable<PlayerStats> {
    return this.http.get<PlayerStats>(`${this.apiUrl}/stats`);
  }
}
