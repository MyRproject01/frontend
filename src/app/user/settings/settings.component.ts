import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  private audioSvc = inject(AudioService);

  draftMaster      = 75;
  draftMusic       = 50;
  draftMusicOn     = true;
  draftSfx         = 80;
  draftSfxOn       = true;

  applied = false;
  private applyTimer: any;

  ngOnInit() {
    this.draftMaster  = this.audioSvc.masterVolume();
    this.draftMusic   = this.audioSvc.musicVolume();
    this.draftMusicOn = this.audioSvc.musicEnabled();
    this.draftSfx     = this.audioSvc.sfxVolume();
    this.draftSfxOn   = this.audioSvc.sfxEnabled();
  }

  applySettings() {
    this.audioSvc.applySettings(
      this.draftMaster,
      this.draftMusic,  this.draftMusicOn,
      this.draftSfx,    this.draftSfxOn
    );

    this.applied = true;
    clearTimeout(this.applyTimer);
    this.applyTimer = setTimeout(() => (this.applied = false), 2000);
  }
}
