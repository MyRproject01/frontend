import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { BuildSelectionService } from '../services/build-selection.service';

@Component({
  selector: 'app-loadout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './loadout.component.html',
  styleUrls: ['./loadout.component.css']
})
export class LoadoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private selectionService = inject(BuildSelectionService);

  fromBuild = toSignal(
    this.route.queryParams.pipe(map(params => params['from'] === 'build'))
  );

  ngOnInit() {
    if (this.fromBuild()) {
      this.selectionService.initSession();
    }
  }

  get returnUrl() {
    return '/main';
  }

  get isSelectionActive() {
    return this.selectionService.isSelectionActive();
  }

  acceptChanges() {
    this.selectionService.accept();
  }

  cancelChanges() {
    this.selectionService.cancel();
  }
}
