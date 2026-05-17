import { Injectable, inject, signal } from '@angular/core';
import { Character, Weapon } from '../loadout/catalog.models';
import { CatalogService } from '../loadout/catalog.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BuildService {
  private catalogService = inject(CatalogService);

  selectedCharacter = signal<Character | null>(null);
  selectedWeapons = signal<Weapon[]>([]);
  selectedBoon = signal<any | null>(null);

  constructor() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('username');
    
    if (token && user) {
      this.loadLastBuild(user);
    }
  }

  loadLastBuild(username: string) {
    const savedBuild = localStorage.getItem(`last_build_${username}`);
    
    if (savedBuild) {
      const build = JSON.parse(savedBuild);
      this.selectedCharacter.set(build.character);
      this.selectedBoon.set(build.boon || null);
      const sortedWeapons = (build.weapons || []).sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
      this.selectedWeapons.set(sortedWeapons);
    } else {
      this.loadDefaultBuild();
    }
  }

  loadDefaultBuild() {
    forkJoin({
      characters: this.catalogService.getUnlockedCharacters(),
      weapons: this.catalogService.getUnlockedWeapons(),
      boons: this.catalogService.getUnlockedBoons()
    }).pipe(
      catchError(() => of({ characters: [], weapons: [], boons: [] }))
    ).subscribe(({ characters, weapons, boons }) => {
      if (characters.length > 0) {
        const sorted = [...characters].sort((a, b) => b.id - a.id);
        this.selectedCharacter.set(sorted[0]);
      }
      if (weapons.length > 0) {
        const sorted = [...weapons].sort((a, b) => (a.price || 0) - (b.price || 0));
        this.selectedWeapons.set(sorted.slice(0, 3));
      }
      if (boons.length > 0) {
        this.selectedBoon.set(boons[0]);
      }
    });
  }

  saveBuild(character: Character | null, weapons: Weapon[], boon: any | null = null) {
    const username = localStorage.getItem('username');
    if (character && username) {
      localStorage.setItem(`last_build_${username}`, JSON.stringify({
        character: character,
        weapons: weapons,
        boon: boon
      }));
    }
  }
}
