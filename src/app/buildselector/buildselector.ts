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
}
