import { Component, signal, AfterViewInit, inject, HostListener, HostBinding } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { AudioService } from './services/audio.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  protected readonly title = signal('maqueta-web');
  private audio = inject(AudioService);
  private router = inject(Router);

  @HostBinding('class.in-game') isInGame = false;

  showTopbar = signal(true);
  showVideo = signal(true);
  username = signal('OPERATOR');

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects;
      const isGame = url.includes('/game');
      const isHiddenRoute = url.includes('/login') || url.includes('/register') || url.includes('/profile') || isGame;
      
      this.showTopbar.set(!isHiddenRoute);
      this.showVideo.set(!isGame);
      this.isInGame = isGame;
      
      // Stop music if we are in the game, play it otherwise (respecting settings)
      this.audio.setMusicPlaying(!isGame);

      this.username.set(localStorage.getItem('username') || 'OPERATOR');
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