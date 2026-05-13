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

  constructor() {
    const user = localStorage.getItem('username');
    if (user) {
      this.loadLastBuild(user);
    } else {
      this.loadDefaultBuild();
    }
  }

  loadLastBuild(username: string) {
    const savedBuild = localStorage.getItem(`last_build_${username}`);
    
    if (savedBuild) {
      const build = JSON.parse(savedBuild);
      this.selectedCharacter.set(build.character);
      const sortedWeapons = (build.weapons || []).sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
      this.selectedWeapons.set(sortedWeapons);
    } else {
      this.loadDefaultBuild();
    }
  }

  loadDefaultBuild() {
    forkJoin({
      characters: this.catalogService.getCharacters(),
      weapons: this.catalogService.getWeapons()
    }).pipe(
      catchError(() => of({ characters: [], weapons: [] }))
    ).subscribe(({ characters, weapons }) => {
      if (characters.length > 0) {
        const sorted = [...characters].sort((a, b) => b.id - a.id);
        this.selectedCharacter.set(sorted[0]);
      }
      if (weapons.length > 0) {
        const sorted = [...weapons].sort((a, b) => (a.price || 0) - (b.price || 0));
        this.selectedWeapons.set(sorted.slice(0, 3));
      }
    });
  }

  saveBuild(character: Character | null, weapons: Weapon[]) {
    const username = localStorage.getItem('username');
    if (character && username) {
      localStorage.setItem(`last_build_${username}`, JSON.stringify({
        character: character,
        weapons: weapons
      }));
    }
  }
}
