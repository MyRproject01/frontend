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
  highScore = 0;
  maxWave = 0;

  ngOnInit() {
    this.playerService.getStats().subscribe({
      next: (stats) => {
        this.highScore = stats.highScore;
        this.maxWave = stats.maxWave;
      },
      error: (err) => {
        console.error('Error fetching player stats', err);
      }
    });
  }
}
