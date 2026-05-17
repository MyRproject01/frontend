import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  readonly masterVolume = signal<number>(75);
  readonly musicVolume  = signal<number>(50);
  readonly musicEnabled = signal<boolean>(true);

  readonly sfxVolume    = signal<number>(80);
  readonly sfxEnabled   = signal<boolean>(true);

  private unmuted = false;
  private isMusicPausedExternally = false;
  private sfxAudio: HTMLAudioElement | null = null;

  init() {
    this.sfxAudio = new Audio('/soundeffect.mp3');
    this.sfxAudio.preload = 'auto';
    this.sfxAudio.volume  = this.effectiveSfxVolume();

    const bgAudio = this.getBgAudio();
    if (!bgAudio) return;

    const unmute = () => {
      if (this.unmuted) return;
      bgAudio.volume = this.effectiveMusicVolume();
      bgAudio.muted  = false;
      this.unmuted   = true;
    };

    const ensurePlayingThenUnmute = () => {
      if (this.unmuted || this.isMusicPausedExternally) return;
      if (!bgAudio.paused) {
        unmute();
      } else {
        bgAudio.play().then(() => unmute()).catch(() => {});
      }
    };

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

  playSfx() {
    if (!this.sfxEnabled()) return;
    const sfx = (this.sfxAudio as HTMLAudioElement).cloneNode() as HTMLAudioElement;
    sfx.volume = this.effectiveSfxVolume();
    sfx.play().catch(() => {});
  }

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

    if (this.sfxAudio) {
      this.sfxAudio.volume = this.effectiveSfxVolume();
    }
  }

  effectiveMusicVolume(): number {
    return (this.masterVolume() / 100) * (this.musicVolume() / 100);
  }

  effectiveSfxVolume(): number {
    return (this.masterVolume() / 100) * (this.sfxVolume() / 100);
  }

  setMusicPlaying(play: boolean) {
    this.isMusicPausedExternally = !play;
    const bgAudio = this.getBgAudio();
    if (!bgAudio) return;

    if (play && this.musicEnabled()) {
      bgAudio.muted = false; 
      bgAudio.volume = this.effectiveMusicVolume();
      bgAudio.play().catch(() => {
      });
    } else {
      bgAudio.pause();
    }
  }

  private getBgAudio(): HTMLAudioElement | null {
    return document.getElementById('bg-music') as HTMLAudioElement | null;
  }
}
