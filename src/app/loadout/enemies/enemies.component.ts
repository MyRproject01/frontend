import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogService } from '../catalog.service';
import { Enemy } from '../catalog.models';

@Component({
  selector: 'app-enemies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './enemies.component.html',
  styleUrls: ['./enemies.component.css']
})
export class EnemiesComponent implements OnInit {
  private catalogService = inject(CatalogService);

  enemies = signal<Enemy[]>([]);
  selectedEnemy = signal<Enemy | null>(null);
  loading = signal<boolean>(true);
  animationState = signal<boolean>(true);

  ngOnInit() {
    this.catalogService.getEnemies().subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) => a.difficulty - b.difficulty);
        this.enemies.set(sorted);
        if (sorted.length > 0) {
          this.selectedEnemy.set(sorted[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load enemies', err);
        this.loading.set(false);
      }
    });
  }

  selectEnemy(enemy: Enemy) {
    this.animationState.set(false);
    this.selectedEnemy.set(enemy);
    setTimeout(() => this.animationState.set(true), 10);
  }

  getImageUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/enemies/${formattedName}.png`;
  }

  getStatSegments(value: number | undefined, maxBase: number, colorType: string): { type: string }[] {
    const val = value || 0;
    const segments = [];
    const blockValue = maxBase / 10;
    const blocksBase = Math.floor(Math.min(val, maxBase) / blockValue);
    const overflow = Math.floor(Math.max(0, val - maxBase) / blockValue);
    for (let i = 0; i < 10; i++) {
      if (i < blocksBase) {
        segments.push({ type: i < overflow ? `overflow-${colorType}` : `on-${colorType}` });
      } else {
        segments.push({ type: 'off' });
      }
    }
    return segments;
  }

  getIconUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/enemies/${formattedName}-icon.png`;
  }
}
