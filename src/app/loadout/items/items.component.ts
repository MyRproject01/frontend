import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

  items = signal<any[]>([]);
  selectedItem = signal<any | null>(null);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.catalogService.getItems().subscribe({
      next: (data) => {
        this.items.set(data);
        if (data && data.length > 0) {
          this.selectedItem.set(data[0]);
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

  getImageUrl(name: string): string {
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');
    return `/items/${formattedName}.png`;
  }
}
