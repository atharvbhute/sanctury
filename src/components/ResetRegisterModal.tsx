import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, LockOpen, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { GlobalOverlay } from './GlobalOverlay';

interface ResetRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void;
}

export const ResetRegisterModal = ({ isOpen, onClose, onRegisterSuccess }: ResetRegisterModalProps) => {
  const { userEmail, profile, setIsResetRegistered } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill details if user is logged in
  useEffect(() => {
    if (profile) {
      setName(profile.displayName || '');
      setEmail(profile.email || '');
    } else if (userEmail) {
      setEmail(userEmail);
    }
  }, [profile, userEmail, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reset-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to submit registration');
      }

      // Success
      setIsResetRegistered(true);
      onRegisterSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlobalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <LockOpen size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans font-semibold text-xl text-gray-900">Unlock 7-Minute Reset™</h3>
            <p className="font-sans text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              Unlock permanent access to our signature somatic NeuroBreath™ recalibration by completing your registration.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              value={email}
              readOnly
              disabled
              placeholder="Email Address"
              required
              className="w-full bg-gray-100 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-400 cursor-not-allowed focus:outline-none transition-all font-sans"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contact Number (WhatsApp)"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-sans px-3 bg-red-50 py-2 rounded-lg">
              <AlertCircle size={14} />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-aura-gradient rounded-2xl py-4 font-label font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register & Unlock'}
          </button>
        </form>
      </div>
    </GlobalOverlay>
  );
};
