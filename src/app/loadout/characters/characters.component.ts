import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../catalog.service';
import { Character } from '../catalog.models';
import { BuildService } from '../../services/build.service';
import { BuildSelectionService } from '../../services/build-selection.service';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.css']
})
export class CharactersComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private buildService = inject(BuildService);
  private selectionService = inject(BuildSelectionService);
  private route = inject(ActivatedRoute);

  characters = signal<Character[]>([]);
  previewCharacter = signal<Character | null>(null);
  loading = signal<boolean>(true);
  animationState = signal<boolean>(true);
  isFromBuild = signal<boolean>(false);

  get pendingCharacter() {
    return this.selectionService.pendingCharacter();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.isFromBuild.set(params['from'] === 'build');
    });

    this.catalogService.getCharacters().subscribe({
      next: (data) => {
        const sortedData = [...data].sort((a, b) => b.id - a.id);
        this.characters.set(sortedData);
        
        // Initial preview
        if (this.isFromBuild() && this.selectionService.pendingCharacter()) {
          this.previewCharacter.set(this.selectionService.pendingCharacter());
        } else if (this.buildService.selectedCharacter()) {
          this.previewCharacter.set(this.buildService.selectedCharacter());
        } else if (sortedData.length > 0) {
          this.previewCharacter.set(sortedData[0]);
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
    this.previewCharacter.set(character);
    setTimeout(() => {
      this.animationState.set(true);
    }, 10);
  }

  confirmSelection() {
    if (this.previewCharacter()) {
      this.selectionService.pendingCharacter.set(this.previewCharacter());
    }
  }

  isCharacterPending(char: Character | null): boolean {
    if (!char) return false;
    return this.selectionService.pendingCharacter()?.id === char.id;
  }

  isCharacterActive(char: Character): boolean {
    return this.buildService.selectedCharacter()?.id === char.id;
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
