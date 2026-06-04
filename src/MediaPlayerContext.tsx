import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface MediaPlayerContextType {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentTrack: string | null;
  repeat: boolean;
  error: string | null;
  isLoading: boolean;
  play: (track: string, customUrl?: string) => void;
  load: (track: string, customUrl?: string) => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  toggleRepeat: () => void;
  seek: (time: number) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | null>(null);

export const useMediaPlayer = () => {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error('useMediaPlayer must be used within a MediaPlayerProvider');
  return context;
};

export const MediaPlayerProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn, userEmail } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(420); // 7 minutes default
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    const handleEnded = () => {
      logSession();
      if (repeat) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error('Repeat play failed:', e));
      } else {
        setIsPlaying(false);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleError = () => {
      const err = audio.error;
      let message = 'An unknown audio error occurred.';
      if (err) {
        switch (err.code) {
          case 1: message = 'Playback aborted.'; break;
          case 2: message = 'Network error.'; break;
          case 3: message = 'Audio decoding failed.'; break;
          case 4: message = 'Audio source not supported or link expired.'; break;
        }
      }
      console.error('Audio playback error:', message, err);
      setError(message);
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [repeat]); // Only re-bind if repeat logic changes, not on every track

  const logSession = async () => {
    if (!isLoggedIn || !userEmail || !currentTrack) return;
    try {
      const token = localStorage.getItem('sanctuary-lms-token');
      if (!token) return;

      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionName: currentTrack,
          duration: currentTime
        })
      });
      if (!res.ok) {
        throw new Error('Failed to save session progress');
      }
    } catch (e) {
      console.error('Error logging reset session progress:', e);
    }
  };

  const load = async (track: string, customUrl?: string) => {
    if (!audioRef.current) return;
    setError(null);
    
    try {
      if (currentTrack !== track) {
        setIsLoading(true);
        setCurrentTrack(track);
        const organUrls: { [key: string]: string } = {
          'Heart': 'https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/organ%20sounds/Heart%20Organ%20Sound.mp3',
          'Kidneys': 'https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/organ%20sounds/Kidney%20Organ%20Sound.mp3',
          'Liver': 'https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/organ%20sounds/Liver%20Organ%20Sound.mp3',
          'Lungs': 'https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/organ%20sounds/Lung%20Organ%20Sound.mp3',
          'Spleen': 'https://pub-4175063e065d455e8dfeafa58c6df57b.r2.dev/organ%20sounds/Spleen%20Organ%20Sound.mp3',
        };

        const trackUrl = customUrl || organUrls[track] || (track === '7-Minute Reset' 
          ? 'https://dl.dropboxusercontent.com/scl/fi/q49e11bcossocishmcyi1/NeruoSomatic-Breathwork-By-Aditi-Nirvaan-TM.mp3?rlkey=6celm54yag5tiz0hvtpna4faq&raw=1' 
          : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3');
        
        audioRef.current.src = trackUrl;
        audioRef.current.crossOrigin = 'anonymous';
        audioRef.current.load();
        
        await new Promise((resolve, reject) => {
          const onLoaded = () => {
            audioRef.current?.removeEventListener('loadedmetadata', onLoaded);
            audioRef.current?.removeEventListener('error', onError);
            resolve(null);
          };
          const onError = (e: any) => {
            audioRef.current?.removeEventListener('loadedmetadata', onLoaded);
            audioRef.current?.removeEventListener('error', onError);
            reject(e);
          };
          audioRef.current?.addEventListener('loadedmetadata', onLoaded);
          audioRef.current?.addEventListener('error', onError);
        });
        setIsLoading(false);
      }
      setIsPlaying(false);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Load failed:', error);
        setError('Failed to load audio. Please check your link or network.');
        setIsPlaying(false);
      }
    }
  };

  const play = async (track: string, customUrl?: string) => {
    if (!audioRef.current) return;
    setError(null);
    
    try {
      if (currentTrack !== track) {
        await load(track, customUrl);
      }
      
      playPromiseRef.current = audioRef.current.play();
      setIsPlaying(true);
      
      await playPromiseRef.current;
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Playback failed:', error);
        setError('Failed to load audio. Please check your link or network.');
        setIsPlaying(false);
      }
    }
  };

  const pause = async () => {
    if (!audioRef.current) return;
    
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
        audioRef.current.pause();
      } catch (error) {
        // Ignore AbortError as it's expected when pausing quickly
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Pause failed:', error);
        }
      }
    } else {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const stop = async () => {
    if (!audioRef.current) return;
    
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Stop failed:', error);
        }
      }
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleRepeat = () => setRepeat(!repeat);

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  return (
    <MediaPlayerContext.Provider value={{
      isPlaying, currentTime, duration, currentTrack, repeat, error, isLoading,
      play, load, pause, stop, reset, toggleRepeat, seek
    }}>
      {children}
    </MediaPlayerContext.Provider>
  );
};
