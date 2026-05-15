import React, { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { GlobalOverlay } from './GlobalOverlay';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal: () => void;
}

export const LoginModal = ({ isOpen, onClose, onOpenLegal }: LoginModalProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
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
        
        <div className="text-center space-y-2 mb-8">
          <h3 className="font-sans font-medium text-xl text-gray-900">Sanctuary Login</h3>
          <p className="font-sans text-sm text-gray-500">Enter your email to access Sanctuary.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-xs text-gray-600 font-sans">
              I agree to the <button type="button" onClick={onOpenLegal} className="text-primary underline">Terms of Service</button> and have read the <button type="button" onClick={onOpenLegal} className="text-primary underline">Professional Disclaimer</button>.
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-sans px-3 bg-red-50 py-2 rounded-lg">
              <AlertCircle size={14} />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full bg-primary text-on-primary rounded-2xl py-4 font-label font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading ? 'Processing...' : 'Login'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </GlobalOverlay>
  );
};
