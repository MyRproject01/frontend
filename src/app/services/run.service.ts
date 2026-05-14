import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface StartRunRequest {
  characterId: number;
  initialBoonId: number;
  weaponIds: number[];
}

export interface GameEndStats {
  score: number;
  waveReached: number;
  enemiesKilled: number;
  timeSurvivedSec: number;
}

@Injectable({
  providedIn: 'root'
})
export class RunService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/runs`;

  startRun(request: StartRunRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/start`, request);
  }

  endRun(runId: number, stats: GameEndStats): Observable<any> {
    return this.http.post(`${this.apiUrl}/${runId}/end`, stats);
  }

  getRewardPool(runId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${runId}/rewards/pool`);
  }

  chooseReward(runId: number, itemId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${runId}/rewards/choose/${itemId}`, {});
  }
}
