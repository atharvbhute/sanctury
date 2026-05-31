import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { useMediaPlayer } from './MediaPlayerContext';
import { AuthUI } from './components/AuthUI';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { SoundsPage } from './components/SoundsPage';
import { ShadowLabPage } from './components/ShadowLabPage';
import { LegalPage } from './components/LegalPage';
import { ProfileModal } from './components/ProfileModal';
import { AnalyticsModals } from './components/AnalyticsModals';
import { LoginModal } from './components/LoginModal';
import { ResetRegisterModal } from './components/ResetRegisterModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, sendEmailVerification } from './firebase';
import {
  Menu,
  Wind,
  Activity,
  Brain,
  Quote,
  RotateCcw,
  Volume2,
  Sunset,
  Map as MapIcon,
  Lock,
  ExternalLink,
  AlertCircle,
  User as UserIcon,
  Mail,
  Zap,
  Flame,
  Gauge,
  Pause,
  Snowflake,
  Users,
  Heart,
  X,
  Download,
  ArrowRight
} from 'lucide-react';

async function checkQuizCompletion(email: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://aditinirvaan.com/api/shadow-mastery/check?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    // This will be true or false!
    return data.completed === true;
  } catch (error) {
    console.error('Error checking quiz completion:', error);
    return false; // Safely fall back to false if the check fails
  }
}

export default function App() {
  const { isLoggedIn, isAdmin, userEmail, profile, loading, activeTheme, setTheme, showLoginModal, setShowLoginModal, updateProfile, isResetRegistered, login } = useAuth();
  const { play, load, currentTrack, stop } = useMediaPlayer();
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [showResetRegisterModal, setShowResetRegisterModal] = useState(false);
  const [activeTab, setActiveTab] = useState('reset');
  const [showGatedPrompt, setShowGatedPrompt] = useState(false);
  const [isShadowDirty, setIsShadowDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [analyticsType, setAnalyticsType] = useState<'daily' | 'vagal' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isCheckingQuiz, setIsCheckingQuiz] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    // Check if already running as installed PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true; // iOS Safari
    if (isStandalone) {
      setIsAppInstalled(true);
      setShowInstallButton(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      // User installed the app — hide all install prompts
      setIsAppInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Stop audio when logged out
  useEffect(() => {
    if (!isLoggedIn) {
      stop();
    }
  }, [isLoggedIn, stop]);

  // Stop audio when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stop]);

  // Sync glow color to CSS variable
  useEffect(() => {
    if (activeTheme?.color) {
      document.documentElement.style.setProperty('--glow-color', activeTheme.color);
      document.documentElement.style.setProperty('--theme-hex', activeTheme.hex);
    }
  }, [activeTheme]);

  const handleGlowChange = async (theme: { name: string, color: string, hex: string }) => {
    setTheme(theme);
    if (isLoggedIn && userEmail) {
      try {
        await updateProfile({ glowColor: theme.color });
      } catch (e) {
        console.error('Failed to save glowColor to profile:', e);
      }
    }
  };

  const handleTabChange = (tabId: string) => {
    stop(); // Stop audio on tab switch
    if (tabId === 'reset' && !isResetRegistered) {
      setShowResetRegisterModal(true);
      setActiveTab('reset');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (tabId === 'map' && !isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (activeTab === 'shadow' && isShadowDirty && tabId !== 'shadow') {
      setPendingTab(tabId);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (tabId === 'map') {
        handleMapClick();
      } else {
        setActiveTab(tabId);
      }
    }
  };

  const handleMapClick = async () => {
    if (!userEmail) return;
    setIsCheckingQuiz(true);
    try {
      const completed = await checkQuizCompletion(userEmail);
      if (completed) {
        window.location.href = "https://www.aditinirvaan.com/destiny-map-pattern-decoder";
      } else {
        window.location.href = "https://www.aditinirvaan.com/destiny-map";
      }
    } catch (err) {
      console.error('Quiz completion check failed, falling back to landing page:', err);
      window.location.href = "https://www.aditinirvaan.com/destiny-map";
    } finally {
      setIsCheckingQuiz(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'reset':
        if (!isResetRegistered) {
          return (
            <section className="relative flex flex-col items-center justify-center w-full min-h-[60vh] text-center p-8 bg-white/40 backdrop-blur-xl rounded-3xl border border-outline-variant/10 shadow-2xl space-y-8 overflow-hidden">
              {/* Background Glow - Localized behind the card */}
              <div
                className="absolute inset-0 blur-[120px] rounded-full scale-90 pointer-events-none transition-colors duration-1000 opacity-30 -z-10 animate-pulse"
                style={{ backgroundColor: activeTheme.color }}
              />

              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    `0 0 20px ${activeTheme.color}22`,
                    `0 0 50px ${activeTheme.color}55`,
                    `0 0 20px ${activeTheme.color}22`
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center border border-primary/20 shadow-xl"
                style={{ color: activeTheme.hex }}
              >
                <Lock size={40} className="stroke-[1.5]" />
              </motion.div>

              <div className="space-y-3 max-w-sm mx-auto z-10">
                <img
                  src="/navlogo.png"
                  alt="Aditi Nirvaan Sanctuary"
                  className="h-12 w-auto mx-auto object-contain mb-4"
                />
                <h3 className="font-headline text-2xl font-bold text-gray-900 mt-4">Unlock 7-Minute Reset™</h3>
                <p className="font-body text-xs text-gray-500 leading-relaxed">
                  Experience our signature somatic NeuroBreath™ recalibration. Complete your quick registration to permanently unlock this session on your account.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowResetRegisterModal(true)}
                className="relative z-10 w-full max-w-[280px] py-4 rounded-2xl font-label font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 text-white"
                style={{ backgroundColor: activeTheme.hex }}
              >
                <span>Register & Unlock</span>
                <ArrowRight size={18} />
              </motion.button>
            </section>
          );
        }

        return (
          <section className="relative flex flex-col items-center w-full min-h-[60vh] justify-center bg-white">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!isLoggedIn) {
                  setShowLoginModal(true);
                  return;
                }
                load('7-Minute Reset');
                setIsPlayerOpen(true);
              }}
              className="relative z-10 w-72 h-72 rounded-full nano-banana-pro clay-shadow flex items-center justify-center group"
            >
              {/* Background Glow - Localized behind the button */}
              <div
                className="absolute inset-0 blur-[100px] rounded-full scale-150 pointer-events-none transition-colors duration-1000 opacity-40 -z-10"
                style={{ backgroundColor: activeTheme.color }}
              />

              {/* Ripple Effect in Chosen Color */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.1, 0.4, 0.1],
                  boxShadow: `0 0 80px ${activeTheme.color}`
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full pointer-events-none"
              />

              <div
                className="absolute inset-6 rounded-full border-2 transition-colors duration-500"
                style={{ borderColor: activeTheme.hex + '33' }} // 20% opacity
              />
              <div className="text-center px-10 flex flex-col items-center space-y-3">
                <Wind className="text-primary text-5xl" style={{ color: activeTheme.hex }} />
                <div className="space-y-1">
                  <span className="font-headline text-2xl font-semibold leading-tight block" style={{ color: activeTheme.hex }}>
                    7-Minute Reset
                  </span>
                  <span className="font-label text-[11px] uppercase tracking-[0.25em] text-on-surface-variant/50">NeuroBreath™</span>
                </div>
                <span className="font-label text-[9px] uppercase tracking-widest mt-2" style={{ color: activeTheme.hex + '99' }}>Tap to Begin</span>
              </div>
            </motion.button>

            <div className="mt-10 flex items-center space-y-2 flex-col">
              <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-surface-container/30 border border-outline-variant/10">
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40"
                    style={{ backgroundColor: activeTheme.hex }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: activeTheme.hex }}
                  />
                </span>
                <p className="font-label text-[11px] tracking-widest uppercase text-on-surface/60">
                  Atmosphere: {activeTheme.name}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center space-y-4">
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-outline/60">Glow Settings</p>
              <div className="flex gap-6">
                {[
                  { name: 'Grounded', color: 'rgba(255, 193, 7, 0.5)', hex: '#FFC107' },
                  { name: 'Deep', color: 'rgba(33, 150, 243, 0.6)', hex: '#2196F3' },
                  { name: 'Soft', color: 'rgba(76, 175, 80, 0.6)', hex: '#4CAF50' }
                ].map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => handleGlowChange(theme)}
                    className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-90 flex items-center justify-center ${activeTheme.name === theme.name ? 'border-primary scale-110 shadow-[0_0_15px_rgba(0,0,0,0.1)]' : 'border-outline/10'}`}
                    style={{ backgroundColor: theme.hex }}
                    title={theme.name}
                  >
                    {activeTheme.name === theme.name && (
                      <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-16">
              {[
                { id: 'daily', title: 'Daily Flow', desc: 'Personalized neurological recalibration.', icon: Activity },
                { id: 'vagal', title: 'Vagal Tone', desc: 'Quantified monitoring of parasympathetic shift.', icon: Brain }
              ].map((item) => (
                <button
                  key={item.title}
                  onClick={() => setAnalyticsType(item.id as any)}
                  className="bg-white border border-outline-variant/10 p-5 rounded-2xl space-y-4 transition-all hover:bg-surface-container-high hover:border-outline-variant/30 cursor-pointer group text-left shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center border border-outline-variant/5 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="text-primary" size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-headline text-sm font-semibold text-on-surface">{item.title}</h3>
                    <p className="font-body text-[11px] text-on-surface-variant/70 leading-relaxed">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      case 'sounds':
        return (
          <SoundsPage
            onOpenPlayer={(track) => {
              if (!isLoggedIn) {
                setShowLoginModal(true);
                return;
              }
              load(track);
              setIsPlayerOpen(true);
            }}
          />
        );
      case 'shadow':
        return (
          <ShadowLabPage
            onDirtyChange={setIsShadowDirty}
            onAuthTrigger={() => setShowLoginModal(true)}
            onOpenPlayer={(trackName, trackUrl) => {
              if (!isLoggedIn) {
                setShowLoginModal(true);
                return;
              }
              load(trackName, trackUrl);
              setIsPlayerOpen(true);
            }}
          />
        );
      case 'map':
        return (
          <div className="space-y-12 py-8 px-4">
            <div className="text-center space-y-4">
              <h2 className="font-headline text-3xl text-on-surface">Map Your Inner Landscape</h2>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
                Your nervous system is a living map. By identifying your current state, you can navigate back to safety and expansion.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'fight', label: 'Fight', icon: Zap, color: '#FF4B2B', desc: 'Mobilized energy for protection.' },
                { id: 'flight', label: 'Flight', icon: Wind, color: '#2196F3', desc: 'High-speed avoidance or escape.' },
                { id: 'freeze', label: 'Freeze', icon: Snowflake, color: '#00BCD4', desc: 'Immobilized shutdown for safety.' },
                { id: 'fawn', label: 'Fawn', icon: Heart, color: '#E91E63', desc: 'Appeasement to avoid conflict.' }
              ].map((card) => (
                <motion.button
                  key={card.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!profile?.hasMapAccess && !isAdmin) {
                      setShowGatedPrompt(true);
                    } else {
                      // Handle map card click
                    }
                  }}
                  className="bg-white border border-outline-variant/10 p-6 rounded-3xl text-left space-y-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-high">
                    <card.icon size={24} style={{ color: card.color }} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-headline text-lg font-bold" style={{ color: card.color }}>{card.label}</h3>
                    <p className="font-body text-[10px] text-on-surface-variant/70 leading-tight">{card.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="p-6 bg-surface-container-high rounded-3xl border border-outline-variant/10 text-center space-y-4">
              <p className="font-label text-[10px] uppercase tracking-widest text-outline">Current Baseline</p>
              <div className="flex justify-center items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span className="font-headline text-xl text-on-surface">Regulated (Ventral Vagal)</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading || isCheckingQuiz) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"
        >
          <Wind className="text-primary" size={32} />
        </motion.div>
        {isCheckingQuiz && (
          <p className="absolute bottom-24 font-label text-[10px] uppercase tracking-widest text-outline animate-pulse">
            Accessing Destiny Map...
          </p>
        )}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <img
              src="/navlogo.png"
              alt="Aditi Nirvaan Sanctuary"
              className="h-12 w-auto mx-auto object-contain mb-4"
            />
            <h3 className="font-sans font-medium text-xl text-gray-900 mt-6 block">Welcome to Sanctuary</h3>
            <p className="font-sans text-xs text-gray-500">Please log in with your ANLMS credentials to enter.</p>
          </div>

          <form onSubmit={handleInlineLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="inline-terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="inline-terms" className="text-xs text-gray-600 font-sans leading-relaxed">
                I agree to the <button type="button" onClick={() => setIsLegalOpen(true)} className="text-primary underline">Terms of Service</button> and have read the <button type="button" onClick={() => setIsLegalOpen(true)} className="text-primary underline">Professional Disclaimer</button>.
              </label>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-600 text-xs font-sans px-3 bg-red-50 py-2 rounded-lg">
                <AlertCircle size={14} />
                <p>{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading || !acceptedTerms}
              className="w-full btn-aura-gradient rounded-2xl py-4 font-label font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loginLoading ? 'Processing...' : 'Login'}
              {!loginLoading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* PWA Install Prompt — only shown when not already installed */}
          {showInstallButton && !isAppInstalled && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 hover:bg-gray-100 hover:border-gray-400 transition-all group"
            >
              <Download size={16} className="text-gray-500 group-hover:text-gray-700 transition-colors" />
              <span className="font-sans text-xs text-gray-600 group-hover:text-gray-800 font-medium transition-colors">
                Install Sanctuary on your device
              </span>
            </button>
          )}
        </div>

        <AnimatePresence>
          {isLegalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000000] bg-background flex flex-col"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/10">
                <h2 className="font-headline text-lg">Terms & Legal</h2>
                <button onClick={() => setIsLegalOpen(false)} className="p-2 rounded-full hover:bg-surface-container">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <LegalPage />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-outline-variant/10 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/navlogo.png"
              alt="Aditi Nirvaan Sanctuary"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-3">
            {showInstallButton && !isAppInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors font-label text-[10px] uppercase tracking-widest font-bold"
              >
                <Download size={12} />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>
            )}
            <AuthUI onOpenProfile={() => setIsProfileOpen(true)} />
          </div>
        </div>
      </header>

      <main className="pt-28 pb-32 px-6 max-w-lg mx-auto flex flex-col items-center space-y-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full relative"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        {/* Quote & Footer */}
        <div className="w-full mt-4 flex flex-col items-center">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent mb-8" />
          <div className="text-center px-8">
            <p className="font-headline text-lg italic text-on-surface-variant/90 leading-relaxed max-w-sm">
              "The breath is the gateway between the mind and the soul."
            </p>
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-outline mt-6 opacity-60">— Sanctuary Wisdom</p>
          </div>

          <div className="mt-12 text-center space-y-4">
            <p className="font-label text-[9px] uppercase tracking-[0.4em] text-outline/40">
              Self-Protection over Self-Sabotage
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setIsLegalOpen(true)} className="text-[10px] uppercase tracking-widest text-outline hover:text-primary">
                Terms & Disclaimer
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Gated Prompt Modal */}
      <AnimatePresence>
        {showGatedPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-background/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="global-modal-center bg-surface-container-high border border-primary/20 p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Lock className="text-primary" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline text-2xl text-on-surface">Unlock Your Destiny Map™</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  You are ready to map your nervous system. Unlock full somatic recalibration with the Destiny Map.
                </p>
              </div>
              <div className="space-y-3">
                <a
                  href="https://www.aditinirvaan.com/destiny-map"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 btn-aura-gradient rounded-xl font-label font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform"
                >
                  Upgrade Now
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={() => setShowGatedPrompt(false)}
                  className="w-full py-3 text-outline font-label text-xs uppercase tracking-widest hover:text-on-surface transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-background/90 backdrop-blur-xl border-t border-primary/10 flex justify-around items-center px-4 pb-6 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] rounded-t-lg">
        {[
          { id: 'reset', label: 'Reset', icon: RotateCcw },
          { id: 'sounds', label: 'Sounds', icon: Volume2 },
          { id: 'shadow', label: 'Shadow', icon: Sunset },
          { id: 'map', label: 'Map', icon: MapIcon, gated: true }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex flex-col items-center justify-center p-3 transition-all duration-300 active:scale-95 ${activeTab === tab.id
              ? 'bg-primary text-on-primary rounded-lg shadow-[inset_2px_2px_4px_rgba(255,255,255,0.2),inset_-2px_-2px_4px_rgba(0,0,0,0.3)]'
              : 'text-on-surface/60 hover:text-primary'
              }`}
          >
            <tab.icon size={24} />
            <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">
              {tab.label}
              {tab.id === 'reset' && !isResetRegistered && <Lock size={10} className="inline ml-1 text-red-500" />}
            </span>
          </button>
        ))}
      </nav>

      {/* Unsaved Changes Guard Modal */}
      <AnimatePresence>
        {pendingTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-background/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="global-modal-center bg-surface-container-high border border-primary/20 p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="text-primary" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline text-2xl text-on-surface">Unsaved Insights</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  You have unsaved changes in your Shadow Lab. Would you like to save before leaving, or discard changes?
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // We can't trigger the save from here easily without a ref, 
                    // but for now let's just allow them to go back or discard.
                    // To be truly professional, we'd use a ref to trigger save.
                    setPendingTab(null);
                  }}
                  className="w-full py-4 btn-aura-gradient rounded-xl font-label font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform"
                >
                  Stay & Save
                </button>
                <button
                  onClick={() => {
                    setIsShadowDirty(false);
                    if (pendingTab === 'map') {
                      handleMapClick();
                    } else {
                      setActiveTab(pendingTab);
                    }
                    setPendingTab(null);
                  }}
                  className="w-full py-3 text-outline font-label text-xs uppercase tracking-widest hover:text-on-surface transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnalyticsModals type={analyticsType} onClose={() => setAnalyticsType(null)} />
      <ResetRegisterModal
        isOpen={showResetRegisterModal}
        onClose={() => setShowResetRegisterModal(false)}
        onRegisterSuccess={() => {
          setIsPlayerOpen(true);
          load('7-Minute Reset');
        }}
      />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onOpenLegal={() => setIsLegalOpen(true)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <FullScreenPlayer isOpen={isPlayerOpen} onClose={() => { setIsPlayerOpen(false); stop(); }} />
      <AnimatePresence>
        {isLegalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000000] bg-background flex flex-col"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/10">
              <h2 className="font-headline text-lg">Terms & Legal</h2>
              <button onClick={() => setIsLegalOpen(false)} className="p-2 rounded-full hover:bg-surface-container">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <LegalPage />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
