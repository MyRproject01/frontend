import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-loadout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './loadout.component.html',
  styleUrls: ['./loadout.component.css']
})
export class LoadoutComponent {
  private route = inject(ActivatedRoute);

  // Detect if we came from build selector
  fromBuild = toSignal(
    this.route.queryParams.pipe(map(params => params['from'] === 'build'))
  );

  get returnUrl() {
    return this.fromBuild() ? '/build-selector' : '/main';
  }

  get returnLabel() {
    return this.fromBuild() ? 'BUILD SELECTOR' : 'MAIN MENU';
  }
}
