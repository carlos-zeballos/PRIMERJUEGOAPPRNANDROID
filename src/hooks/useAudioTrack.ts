import { useEffect } from 'react';
import { AudioManager, AudioTrack } from '../services/audio/AudioManager';

export function useAudioTrack(track: AudioTrack): void {
  useEffect(() => {
    AudioManager.switchTo(track);
  }, [track]);
}
