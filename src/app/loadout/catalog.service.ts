import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}
