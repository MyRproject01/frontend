import { Injectable, inject, signal } from '@angular/core';
import { BuildService } from './build.service';
import { Character, Weapon } from '../loadout/catalog.models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class BuildSelectionService {
  private buildService = inject(BuildService);
  private router = inject(Router);

  pendingCharacter = signal<Character | null>(null);
  pendingWeapons = signal<Weapon[]>([]);
  isSelectionActive = signal<boolean>(false);

  initSession() {
    this.pendingCharacter.set(this.buildService.selectedCharacter());
    this.pendingWeapons.set([...this.buildService.selectedWeapons()]);
    this.isSelectionActive.set(true);
  }

  cancel() {
    this.isSelectionActive.set(false);
    this.router.navigate(['/build-selector']);
  }

  accept() {
    const char = this.pendingCharacter();
    const weapons = this.pendingWeapons();
    
    if (char) {
      this.buildService.selectedCharacter.set(char);
      const sortedWeapons = [...weapons].sort((a, b) => (a.price || 0) - (b.price || 0));
      this.buildService.selectedWeapons.set(sortedWeapons);
      this.buildService.saveBuild(char, sortedWeapons);
    }
    
    this.isSelectionActive.set(false);
    this.router.navigate(['/build-selector']);
  }
}
