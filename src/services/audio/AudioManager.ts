import { Audio } from 'expo-av';
import { AppState, AppStateStatus } from 'react-native';

export type AudioTrack = 'PRINCIPAL' | 'TENSION' | 'FIN_PARTIDA';

const SOURCES: Record<AudioTrack, number> = {
  PRINCIPAL:   require('../../../assets/audio/ambient/MUSICA_PRINCIPAL.flac'),
  TENSION:     require('../../../assets/audio/ambient/MUSICA_TENSION.wav'),
  FIN_PARTIDA: require('../../../assets/audio/ambient/FIN_DE_LA_PARTIDA.mp3'),
};

const LOOPS: Record<AudioTrack, boolean> = {
  PRINCIPAL:   true,
  TENSION:     true,
  FIN_PARTIDA: false,
};

const FADE_MS      = 600;
const TARGET_VOLUME = 0.75;

class AudioManagerClass {
  private sound: Audio.Sound | null = null;
  private currentTrack: AudioTrack | null = null;
  private pendingTrack: AudioTrack | null = null;
  private isTransitioning = false;
  private appSub: ReturnType<typeof AppState.addEventListener> | null = null;

  async initialize(): Promise<void> {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    this.appSub = AppState.addEventListener('change', this.onAppState);
  }

  private onAppState = async (next: AppStateStatus): Promise<void> => {
    if (!this.sound) return;
    try {
      if (next === 'background' || next === 'inactive') {
        await this.sound.pauseAsync();
      } else if (next === 'active') {
        await this.sound.playAsync();
      }
    } catch {}
  };

  async switchTo(track: AudioTrack): Promise<void> {
    if (this.currentTrack === track && !this.isTransitioning) return;
    if (this.isTransitioning) {
      this.pendingTrack = track;
      return;
    }
    await this._doSwitch(track);
    if (this.pendingTrack && this.pendingTrack !== this.currentTrack) {
      const next = this.pendingTrack;
      this.pendingTrack = null;
      await this._doSwitch(next);
    }
  }

  private async _doSwitch(track: AudioTrack): Promise<void> {
    this.isTransitioning = true;
    try {
      if (this.sound) {
        await this._fade(this.sound, TARGET_VOLUME, 0, FADE_MS);
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        SOURCES[track],
        { isLooping: LOOPS[track], volume: 0, shouldPlay: true },
      );
      this.sound = sound;
      this.currentTrack = track;
      await this._fade(sound, 0, TARGET_VOLUME, FADE_MS);
    } catch {
      // audio no es crítico — la app sigue funcionando sin sonido
    } finally {
      this.isTransitioning = false;
    }
  }

  private _fade(sound: Audio.Sound, from: number, to: number, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const steps  = 15;
      const stepMs = durationMs / steps;
      const delta  = (to - from) / steps;
      let step = 0;
      let vol  = from;

      const id = setInterval(async () => {
        step++;
        vol = Math.max(0, Math.min(1, vol + delta));
        try { await sound.setVolumeAsync(vol); } catch {}
        if (step >= steps) {
          clearInterval(id);
          resolve();
        }
      }, stepMs);
    });
  }

  async stop(): Promise<void> {
    if (!this.sound) return;
    try {
      await this._fade(this.sound, TARGET_VOLUME, 0, 300);
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
    } catch {}
    this.sound = null;
    this.currentTrack = null;
  }

  dispose(): void {
    this.stop();
    this.appSub?.remove();
    this.appSub = null;
  }
}

export const AudioManager = new AudioManagerClass();
