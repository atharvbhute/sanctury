import { useAuth } from '../AuthContext';
import { User as UserIcon } from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { useState } from 'react';

interface AuthUIProps {
  onOpenProfile: () => void;
}

export const AuthUI = ({ onOpenProfile }: AuthUIProps) => {
  const { isLoggedIn, profile, loading, setShowLoginModal } = useAuth();

  if (loading) return null;

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => setShowLoginModal(true)}
        className="font-sans text-xs tracking-[0.25em] uppercase px-5 py-2.5 btn-aura-gradient rounded-full font-bold hover:scale-105 transition-all active:scale-95"
      >
        Login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onOpenProfile}
        className="h-10 w-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/20 hover:scale-105 transition-transform active:scale-95"
      >
        {profile?.photoURL ? (
          <img 
            src={profile.photoURL} 
            alt="Profile" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target.parentElement?.querySelector('.fallback-icon') as HTMLElement)?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center bg-primary/10 fallback-icon ${profile?.photoURL ? 'hidden' : ''}`}>
          <UserIcon size={20} className="text-primary" />
        </div>
      </button>
    </div>
  );
};
