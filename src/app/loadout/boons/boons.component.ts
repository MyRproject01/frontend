import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CatalogService } from '../catalog.service';
import { BuildSelectionService } from '../../services/build-selection.service';

@Component({
  selector: 'app-boons',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './boons.component.html',
  styleUrls: ['./boons.component.css']
})
export class BoonsComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private sanitizer = inject(DomSanitizer);
  private selectionService = inject(BuildSelectionService);
  private route = inject(ActivatedRoute);

  boons = signal<any[]>([]);
  selectedBoon = signal<any | null>(null);
  loading = signal<boolean>(true);
  isFromBuild = signal<boolean>(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.isFromBuild.set(params['from'] === 'build');
    });

    this.catalogService.getUnlockedBoons().subscribe({
      next: (data) => {
        const sorted = data.sort((a: any, b: any) => a.id - b.id);
        this.boons.set(sorted);
        
        // Initial preview
        if (this.isFromBuild() && this.selectionService.pendingBoon()) {
          this.selectedBoon.set(this.selectionService.pendingBoon());
        } else if (sorted.length > 0) {
          this.selectedBoon.set(sorted[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load boons', err);
        this.loading.set(false);
      }
    });
  }

  selectBoon(boon: any) {
    this.selectedBoon.set(boon);
  }

  confirmSelection() {
    if (this.selectedBoon()) {
      this.selectionService.pendingBoon.set(this.selectedBoon());
    }
  }

  isBoonPending(boon: any): boolean {
    if (!boon) return false;
    return this.selectionService.pendingBoon()?.id === boon.id;
  }

  getImageUrl(name: string | undefined): string {
    if (!name) return '/boons/generic.png';
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/boons/${formattedName}.png`;
  }

  getIconUrl(name: string | undefined): string {
    if (!name) return '/boons/generic-icon.png';
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/boons/${formattedName}-icon.png`;
  }

  formatDescription(desc: string | undefined): SafeHtml {
    if (!desc) return '';
    
    let formatted = desc.trim()
      .replace(/^[\s-]+/, '') 
      .replace(/-?\s*(Effect:|Passive:|Synergy:|Sinergy:)/gi, '$1'); 
    
    formatted = formatted.replace(/(Effect:|Passive:|Synergy:|Sinergy:)/gi, '<br>- $1');
    formatted = formatted.replace(/^<br>/, '');
    
    if (formatted && !formatted.startsWith('-')) {
      formatted = '- ' + formatted;
    }
    
    formatted = formatted.replace(/(Effect:)/gi, '<span class="keyword-effect">$1</span>');
    formatted = formatted.replace(/(Passive:)/gi, '<span class="keyword-passive">$1</span>');
    formatted = formatted.replace(/(Synergy:|Sinergy:)/gi, '<span class="keyword-synergy">$1</span>');
    
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }
}
