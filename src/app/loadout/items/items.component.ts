import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CatalogService } from '../catalog.service';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private sanitizer = inject(DomSanitizer);

  items = signal<any[]>([]);
  selectedItem = signal<any | null>(null);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.catalogService.getUnlockedItems().subscribe({
      next: (data) => {
        const sorted = data.sort((a: any, b: any) => a.id - b.id);
        this.items.set(sorted);
        if (sorted.length > 0) {
          this.selectedItem.set(sorted[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load items', err);
        this.loading.set(false);
      }
    });
  }

  selectItem(item: any) {
    this.selectedItem.set(item);
  }

  getImageUrl(name: string | undefined): string {
    if (!name) return '/items/generic.png';
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/items/${formattedName}.png`;
  }

  getIconUrl(name: string | undefined): string {
    if (!name) return '/items/generic-icon.png';
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/items/${formattedName}-icon.png`;
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
