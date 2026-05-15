import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Camera, LogOut, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { GlobalOverlay } from './GlobalOverlay';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { updateDoc, doc } from 'firebase/firestore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
];

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { userEmail, profile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setDisplayName(profile?.displayName || '');
  }, [profile?.displayName]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    setLoading(true);
    setMessage(null);

    try {
      // Update Firestore
      const userDocRef = doc(db, 'users', userEmail);
      await updateDoc(userDocRef, { displayName });
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
      handleFirestoreError(err, OperationType.UPDATE, `users/${userEmail}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = async (url: string) => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', userEmail);
      await updateDoc(userDocRef, { photoURL: url });
      setMessage({ type: 'success', text: 'Avatar updated' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to update avatar' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <GlobalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="relative">
        <button onClick={onClose} className="absolute -top-2 -right-2 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <X size={20} className="text-gray-500" />
        </button>
        
        <h2 className="font-sans font-medium text-xl text-gray-900 mb-8">Your Sanctuary</h2>

        <div className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={48} />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary text-on-primary rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !userEmail) return;

                  if (file.size > 1024 * 1024) {
                    setMessage({ type: 'error', text: 'Image too large (max 1MB)' });
                    return;
                  }

                  setLoading(true);
                  try {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64String = reader.result as string;
                      const userDocRef = doc(db, 'users', userEmail);
                      await updateDoc(userDocRef, { photoURL: base64String });
                      setMessage({ type: 'success', text: 'Profile picture updated!' });
                      setLoading(false);
                    };
                    reader.readAsDataURL(file);
                  } catch (err: any) {
                    setMessage({ type: 'error', text: 'Failed to upload image' });
                    setLoading(false);
                  }
                }}
              />
            </div>
            
            <div className="flex gap-3">
              {AVATAR_COLORS.map((color, i) => (
                <button
                  key={i}
                  onClick={() => handleAvatarSelect(color)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${color} transition-all ${profile?.photoURL === color ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-105'}`}
                >
                  {displayName ? getInitials(displayName) : '?'}
                </button>
              ))}
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="font-sans text-xs uppercase tracking-widest text-gray-500 px-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
              />
            </div>

            {message && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-sans ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary rounded-2xl py-3 font-label font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </button>
          </form>

          {/* Actions Section */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-colors group"
            >
              <LogOut size={18} />
              <span className="font-sans font-medium">Logout</span>
            </button>
          </div>
          <div className="text-center text-[10px] text-gray-400 font-sans">Version 1.0.5</div>
        </div>
      </div>
    </GlobalOverlay>
  );
};
