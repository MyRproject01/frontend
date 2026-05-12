import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../loadout/catalog.service';
import { Character, Weapon } from '../loadout/catalog.models';

@Component({
  selector: 'app-buildselector',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './buildselector.html',
  styleUrl: './buildselector.css',
})
export class Buildselector implements OnInit {
  private catalogService = inject(CatalogService);
  selectedCharacter = signal<Character | null>(null);
  selectedWeapons = signal<Weapon[]>([]);
  animationState = signal<boolean>(true);

  ngOnInit() {
    // Fetch Character
    this.catalogService.getCharacters().subscribe({
      next: (data) => {
        if (data.length > 0) {
          const sortedData = [...data].sort((a, b) => b.id - a.id);
          this.selectedCharacter.set(sortedData[0]);
        }
      }
    });

    // Fetch Weapons
    this.catalogService.getWeapons().subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.selectedWeapons.set(data.slice(0, 3));
        }
      }
    });
  }

  getImageUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/characters/${formattedName}.png`;
  }

  getWeaponIconUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/weapons/${formattedName}-icon.png`;
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
