import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Character, Weapon } from './catalog.models';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getCharacters(): Observable<Character[]> {
    return this.http.get<{content: Character[]}>(`${this.apiUrl}/characters`)
      .pipe(map(response => response.content));
  }

  getCharacterById(id: number): Observable<Character> {
    return this.http.get<Character>(`${this.apiUrl}/characters/${id}`);
  }

  getWeapons(): Observable<Weapon[]> {
    return this.http.get<{content: Weapon[]}>(`${this.apiUrl}/weapons`)
      .pipe(map(response => response.content));
  }

  getItems(): Observable<any[]> {
    return this.http.get<{content: any[]}>(`${this.apiUrl}/items`)
      .pipe(map(response => response.content || response as any));
  }

  getEnemies(): Observable<any[]> {
    return this.http.get<{content: any[]}>(`${this.apiUrl}/enemies`)
      .pipe(map(response => response.content || response as any));
  }

  getBoons(): Observable<any[]> {
    return this.http.get<{content: any[]}>(`${this.apiUrl}/boons`)
      .pipe(map(response => response.content || response as any));
  }

  getUnlockedCharacters(): Observable<Character[]> {
    return forkJoin([
      this.getCharacters(),
      this.http.get<{content: number[]}>(`${this.apiUrl}/player/unlocks/characters`)
        .pipe(map(res => res.content || []))
    ]).pipe(
      map(([all, unlockedIds]) => all.filter(c => unlockedIds.includes(c.id)))
    );
  }

  getUnlockedWeapons(): Observable<Weapon[]> {
    return forkJoin([
      this.getWeapons(),
      this.http.get<{content: number[]}>(`${this.apiUrl}/player/unlocks/weapons`)
        .pipe(map(res => res.content || []))
    ]).pipe(
      map(([all, unlockedIds]) => all.filter(w => unlockedIds.includes(w.id)))
    );
  }

  getUnlockedBoons(): Observable<any[]> {
    return forkJoin([
      this.getBoons(),
      this.http.get<{content: number[]}>(`${this.apiUrl}/player/unlocks/boons`)
        .pipe(map(res => res.content || []))
    ]).pipe(
      map(([all, unlockedIds]) => all.filter(b => unlockedIds.includes(b.id)))
    );
  }

  getUnlockedItems(): Observable<any[]> {
    return forkJoin([
      this.getItems(),
      this.http.get<{content: number[]}>(`${this.apiUrl}/player/unlocks/items`)
        .pipe(map(res => res.content || []))
    ]).pipe(
      map(([all, unlockedIds]) => all.filter(i => unlockedIds.includes(i.id)))
    );
  }
}
