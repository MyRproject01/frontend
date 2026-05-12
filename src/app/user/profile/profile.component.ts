import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerService, PlayerStats } from '../../services/player.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private playerService = inject(PlayerService);
  
  username = signal(localStorage.getItem('username') || 'OPERATOR');
  stats = signal<PlayerStats | null>(null);

  ngOnInit() {
    this.playerService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (err) => {
        console.error('Error fetching player stats', err);
      }
    });
  }

  formatTime(seconds: number | undefined): string {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
