import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../catalog.service';
import { Character, Weapon } from '../catalog.models';
import { BuildService } from '../../services/build.service';
import { BuildSelectionService } from '../../services/build-selection.service';

@Component({
  selector: 'app-weapons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weapons.component.html',
  styleUrls: ['./weapons.component.css']
})
export class WeaponsComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private buildService = inject(BuildService);
  private selectionService = inject(BuildSelectionService);
  private route = inject(ActivatedRoute);

  weapons = signal<Weapon[]>([]);
  previewWeapon = signal<Weapon | null>(null);
  loading = signal<boolean>(true);
  animationState = signal<boolean>(true);
  isFromBuild = signal<boolean>(false);
  
  get pendingWeapons() {
    return this.selectionService.pendingWeapons();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.isFromBuild.set(params['from'] === 'build');
    });

    this.catalogService.getUnlockedWeapons().subscribe({
    next: (data) => {
      const sorted = [...data].sort((a, b) => (a.price || 0) - (b.price || 0));
      this.weapons.set(sorted);
      
      // Initial preview
      if (this.isFromBuild() && this.selectionService.pendingWeapons().length > 0) {
        this.previewWeapon.set(this.selectionService.pendingWeapons()[0]);
      } else if (this.buildService.selectedWeapons().length > 0) {
        this.previewWeapon.set(this.buildService.selectedWeapons()[0]);
      } else if (data.length > 0) {
        this.previewWeapon.set(data[0]);
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
    this.previewWeapon.set(weapon);
    setTimeout(() => {
      this.animationState.set(true);
    }, 10);
  }

  isWeaponPending(weapon: Weapon | null): boolean {
    if (!weapon) return false;
    return this.selectionService.pendingWeapons().some(w => w.id === weapon.id);
  }

  isWeaponActive(weapon: Weapon | null): boolean {
    if (!weapon) return false;
    return this.buildService.selectedWeapons().some(w => w.id === weapon.id);
  }

  toggleWeapon(weapon: Weapon | null, select: boolean) {
    if (!weapon) return;
    
    const current = this.selectionService.pendingWeapons();
    if (select) {
      if (current.length < 3 && !current.some(w => w.id === weapon.id)) {
        this.selectionService.pendingWeapons.set([...current, weapon]);
      }
    } else {
      this.selectionService.pendingWeapons.set(current.filter(w => w.id !== weapon.id));
    }
  }

  confirmSelection() {
    // This button might be redundant now but we can keep it as a "Add to build" shortcut
    this.toggleWeapon(this.previewWeapon(), true);
  }

  getImageUrl(name: string | undefined): string {
    if (!name) return '/weapons/generic.png';
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/weapons/${formattedName}.png`;
  }

  getIconUrl(name: string | undefined): string {
    if (!name) return '/weapons/generic-icon.png';
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
