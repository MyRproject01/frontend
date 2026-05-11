import { Component, signal, AfterViewInit, inject, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AudioService } from './services/audio.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  protected readonly title = signal('maqueta-web');
  private audio = inject(AudioService);
  private router = inject(Router);

  showTopbar = signal(true);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects;
      const isHiddenRoute = url.includes('/login') || url.includes('/register') || url.includes('/profile');
      this.showTopbar.set(!isHiddenRoute);
    });
  }

  ngAfterViewInit() {
    // Unmute and start playback immediately — no user interaction needed.
    this.audio.init();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.audio.playSfx();
  }
}