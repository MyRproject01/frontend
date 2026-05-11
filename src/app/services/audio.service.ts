import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  // ─── Applied (live) state ──────────────────────────────────────────────────
  readonly masterVolume = signal<number>(75);
  readonly musicVolume  = signal<number>(50);
  readonly musicEnabled = signal<boolean>(true);

  readonly sfxVolume    = signal<number>(80);
  readonly sfxEnabled   = signal<boolean>(true);

  private unmuted = false;
  private sfxAudio: HTMLAudioElement | null = null;

  // ──────────────────────────────────────────────────────────────────────────
  // Init — called once from app.ts after DOM is ready.
  // Uses a waterfall of 5 strategies to unmute muted-autoplay audio ASAP.
  // ──────────────────────────────────────────────────────────────────────────
  init() {
    // Pre-load the SFX so the first click has no delay
    this.sfxAudio = new Audio('/soundeffect.mp3');
    this.sfxAudio.preload = 'auto';
    this.sfxAudio.volume  = this.effectiveSfxVolume();

    // ── Unmute the background music ─────────────────────────────────────────
    const bgAudio = this.getBgAudio();
    if (!bgAudio) return;

    const unmute = () => {
      if (this.unmuted) return;
      bgAudio.volume = this.effectiveMusicVolume();
      bgAudio.muted  = false;
      this.unmuted   = true;
    };

    const ensurePlayingThenUnmute = () => {
      if (this.unmuted) return;
      if (!bgAudio.paused) {
        unmute();
      } else {
        bgAudio.play().then(() => unmute()).catch(() => {});
      }
    };

    // Best practice: wait for first user interaction to start audio
    const onInteraction = () => {
      ensurePlayingThenUnmute();
      document.removeEventListener('click',      onInteraction);
      document.removeEventListener('keydown',    onInteraction);
      document.removeEventListener('touchstart', onInteraction);
    };
    
    document.addEventListener('click',      onInteraction, { once: true });
    document.addEventListener('keydown',    onInteraction, { once: true });
    document.addEventListener('touchstart', onInteraction, { once: true });
  }

  // ─── Play SFX (called by the click directive) ──────────────────────────────
  playSfx() {
    if (!this.sfxEnabled()) return;
    // Cloning allows overlapping rapid clicks
    const sfx = (this.sfxAudio as HTMLAudioElement).cloneNode() as HTMLAudioElement;
    sfx.volume = this.effectiveSfxVolume();
    sfx.play().catch(() => {});
  }

  // ─── Apply a complete settings snapshot (called by Apply button) ──────────
  applySettings(
    master: number,
    music: number, musicOn: boolean,
    sfx: number,   sfxOn: boolean
  ) {
    this.masterVolume.set(master);
    this.musicVolume.set(music);
    this.musicEnabled.set(musicOn);
    this.sfxVolume.set(sfx);
    this.sfxEnabled.set(sfxOn);

    // Update background music
    const bgAudio = this.getBgAudio();
    if (bgAudio) {
      if (musicOn) {
        bgAudio.muted  = false;
        bgAudio.volume = this.effectiveMusicVolume();
        if (bgAudio.paused) bgAudio.play().catch(() => {});
      } else {
        bgAudio.pause();
      }
    }

    // Update SFX pre-loaded audio volume for next plays
    if (this.sfxAudio) {
      this.sfxAudio.volume = this.effectiveSfxVolume();
    }
  }

  // ─── Volume helpers ────────────────────────────────────────────────────────
  effectiveMusicVolume(): number {
    return (this.masterVolume() / 100) * (this.musicVolume() / 100);
  }

  effectiveSfxVolume(): number {
    return (this.masterVolume() / 100) * (this.sfxVolume() / 100);
  }

  private getBgAudio(): HTMLAudioElement | null {
    return document.getElementById('bg-music') as HTMLAudioElement | null;
  }
}
