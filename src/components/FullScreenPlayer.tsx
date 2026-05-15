import { motion, AnimatePresence } from 'motion/react';
import { useMediaPlayer } from '../MediaPlayerContext';
import { useAuth } from '../AuthContext';
import { X, RotateCcw, Repeat, Play, Pause, BellOff, Info, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

export const FullScreenPlayer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { isPlaying, currentTime, duration, currentTrack, repeat, error, isLoading, pause, play, stop, reset, toggleRepeat, seek } = useMediaPlayer();
  const { profile, activeTheme } = useAuth();
  const [isFocusMode, setIsFocusMode] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play(currentTrack || '7-Minute Reset');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[1000] bg-[#0A0A0A] flex flex-col items-center justify-between p-8"
        >
          <div className="w-full flex justify-between items-start relative z-[1010]">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }} 
              className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/20 active:scale-90 shadow-lg cursor-pointer"
              aria-label="Close Player"
            >
              <X size={32} style={{ color: activeTheme.hex }} />
            </button>
            <div className="text-center">
              <p className="font-label text-[10px] uppercase tracking-[0.3em] text-white/40">Now Playing</p>
              <h3 className="font-headline text-xl" style={{ color: activeTheme.hex }}>{currentTrack}</h3>
              {isLoading && (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-t-transparent rounded-full mx-auto mt-2"
                  style={{ borderColor: activeTheme.hex }}
                />
              )}
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-[10px] font-label uppercase tracking-widest mt-1"
                >
                  {error}
                </motion.p>
              )}
            </div>
            <div className="flex flex-col items-end gap-4 relative z-[1010]">
              <button 
                type="button"
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`p-3 rounded-full transition-all border shadow-lg cursor-pointer ${isFocusMode ? 'border-[#F2CA50] text-[#0A0A0A]' : 'bg-white/5 border-white/10 text-white/40'}`}
                style={{ 
                  backgroundColor: isFocusMode ? activeTheme.hex : 'transparent',
                  borderColor: isFocusMode ? activeTheme.hex : 'rgba(255,255,255,0.1)'
                }}
                title="Focus Mode (Mute Notifications)"
              >
                <BellOff size={20} />
              </button>
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center w-full max-w-md">
            {/* Breathing Glow Background */}
            <motion.div 
              animate={{ 
                opacity: isPlaying ? [0.4, 0.1, 0.4] : 0.2,
                scale: isPlaying ? [1.5, 1.6, 1.5] : 1.4
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 blur-[120px] rounded-full pointer-events-none" 
              style={{ backgroundColor: activeTheme.color }}
            />
            
            <motion.button
              type="button"
              onClick={togglePlayPause}
              animate={{ 
                scale: isPlaying ? [1, 1.05, 1] : 1,
                boxShadow: isPlaying 
                  ? [
                      `0 0 40px ${activeTheme.color}`,
                      `0 0 80px ${activeTheme.color}`,
                      `0 0 40px ${activeTheme.color}`
                    ] 
                  : '0 0 20px rgba(0,0,0,0.5)'
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-72 h-72 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.6),inset_10px_10px_30px_rgba(255,255,255,0.05)] flex items-center justify-center group cursor-pointer"
            >
               <div 
                 className={`absolute inset-4 rounded-full border-2 transition-all duration-1000 ${isPlaying ? 'animate-breathing' : ''}`} 
                 style={{ borderColor: activeTheme.color }}
               />
               <div className="relative flex items-center justify-center">
                 <AnimatePresence mode="wait">
                   {isPlaying ? (
                     <motion.div
                       key="pause"
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.8 }}
                     >
                       <Pause size={64} style={{ color: activeTheme.hex }} className="opacity-20 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                     </motion.div>
                   ) : (
                     <motion.div
                       key="play"
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.8 }}
                     >
                       <Play size={64} style={{ color: activeTheme.hex }} className="ml-2" fill="currentColor" />
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            </motion.button>
            
            <div className="mt-12 text-center space-y-2">
              <p className="font-label text-sm text-white/80 uppercase tracking-[0.3em]">Breathe with the light</p>
              <p className="font-body italic text-white/40 text-xs">Exhale tension, inhale presence</p>
            </div>
          </div>

          <div className="w-full max-w-md space-y-8 pb-8">
            <div className="space-y-2">
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full"
                  style={{ 
                    width: `${(currentTime / duration) * 100}%`,
                    backgroundColor: activeTheme.hex,
                    boxShadow: `0 0 20px ${activeTheme.color}`
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
              <div className="flex justify-between font-label text-[10px] text-white/60 uppercase tracking-widest">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-around">
              <button
                onClick={toggleRepeat}
                className="p-3 rounded-full transition-all"
                style={{ 
                  backgroundColor: repeat ? activeTheme.hex + '33' : 'transparent',
                  color: repeat ? activeTheme.hex : 'rgba(255,255,255,0.4)'
                }}
              >
                <Repeat size={24} />
              </button>
              
              <button
                onClick={togglePlayPause}
                className="w-24 h-24 rounded-full text-[#0A0A0A] flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-4 border-white/10"
                style={{ 
                  backgroundColor: activeTheme.hex,
                  boxShadow: `0 0 40px ${activeTheme.color}`
                }}
              >
                {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
              </button>

              <button
                onClick={reset}
                className="p-3 rounded-full text-white/40 hover:text-white transition-all"
                title="Reset Track"
              >
                <RotateCcw size={24} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
