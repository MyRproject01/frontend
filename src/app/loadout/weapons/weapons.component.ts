import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../catalog.service';
import { Weapon } from '../catalog.models';

@Component({
  selector: 'app-weapons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weapons.component.html',
  styleUrls: ['./weapons.component.css']
})
export class WeaponsComponent implements OnInit {
  private catalogService = inject(CatalogService);

  weapons = signal<Weapon[]>([]);
  selectedWeapon = signal<Weapon | null>(null);
  loading = signal<boolean>(true);
  animationState = signal<boolean>(true);

  ngOnInit() {
    this.catalogService.getWeapons().subscribe({
      next: (data) => {
        this.weapons.set(data);
        if (data.length > 0) {
          this.selectedWeapon.set(data[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching weapons:', err);
        this.loading.set(false);
      }
    });
  }

  selectWeapon(weapon: Weapon) {
    this.animationState.set(false);
    this.selectedWeapon.set(weapon);
    setTimeout(() => {
      this.animationState.set(true);
    }, 10);
  }

  getImageUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/weapons/${formattedName}.png`;
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
