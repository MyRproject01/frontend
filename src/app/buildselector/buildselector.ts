import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../loadout/catalog.service';
import { Character, Weapon } from '../loadout/catalog.models';
import { BuildService } from '../services/build.service';

@Component({
  selector: 'app-buildselector',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './buildselector.html',
  styleUrl: './buildselector.css',
})
export class Buildselector {
  private catalogService = inject(CatalogService);
  private buildService = inject(BuildService);
  private router = inject(Router);

  selectedCharacter = this.buildService.selectedCharacter;
  selectedWeapons = this.buildService.selectedWeapons;
  selectedBoon = this.buildService.selectedBoon;
  animationState = signal<boolean>(true);

  confirmBuild() {
    this.buildService.saveBuild(this.selectedCharacter(), this.selectedWeapons(), this.selectedBoon());
    this.router.navigate(['/game']);
  }

  getImageUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/characters/${formattedName}.png`;
  }

  getWeaponIconUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/weapons/${formattedName}-icon.png`;
  }

  getBoonIconUrl(name: string | undefined): string {
    if (!name) return '/boons/generic-icon.png';
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/boons/${formattedName}-icon.png`;
  }

  getStatSegments(value: number | undefined, maxBase: number, colorType: string): { type: string }[] {
    const val = value || 0;
    const segments = [];
    const blockValue = maxBase / 10;
    const blocksBase = Math.floor(Math.min(val, maxBase) / blockValue);
    const overflow = Math.floor(Math.max(0, val - maxBase) / blockValue);

    for (let i = 0; i < 10; i++) {
      if (i < blocksBase) {
        if (i < overflow) {
          segments.push({ type: `overflow-${colorType}` });
        } else {
          segments.push({ type: `on-${colorType}` });
        }
      } else {
        segments.push({ type: 'off' });
      }
    }
    return segments;
  }
}
