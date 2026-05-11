import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../catalog.service';
import { Character } from '../catalog.models';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.css']
})
export class CharactersComponent implements OnInit {
  private catalogService = inject(CatalogService);

  characters = signal<Character[]>([]);
  selectedCharacter = signal<Character | null>(null);
  loading = signal<boolean>(true);
  animationState = signal<boolean>(true);

  ngOnInit() {
    this.catalogService.getCharacters().subscribe({
      next: (data) => {
        const sortedData = [...data].sort((a, b) => b.id - a.id);
        this.characters.set(sortedData);
        if (sortedData.length > 0) {
          this.selectedCharacter.set(sortedData[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching characters:', err);
        this.loading.set(false);
      }
    });
  }

  selectCharacter(character: Character) {
    // Force DOM destruction and recreation to re-trigger CSS animations
    this.animationState.set(false);
    this.selectedCharacter.set(character);
    setTimeout(() => {
      this.animationState.set(true);
    }, 10);
  }

  getIconUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/characters/${formattedName}-icon.png`;
  }

  getImageUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/characters/${formattedName}.png`;
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
