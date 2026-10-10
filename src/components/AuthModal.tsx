import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Play, AlertCircle } from 'lucide-react';
import { api } from '../lib/api.ts';
import { User, StudentProfile } from '../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, profile: StudentProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim()) throw new Error('Please enter your full name');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        const res = await api.register(email, password, fullName);
        onAuthSuccess(res.user, res.profile);
      } else {
        const res = await api.login(email, password);
        onAuthSuccess(res.user, res.profile);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.loginDemo();
      onAuthSuccess(res.user, res.profile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to load demo profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C241D]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8E2D5] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#F0EBE0]">
          <div>
            <h2 className="text-xl font-bold text-[#2C241D]">
              {isRegister ? 'Create Student Account' : 'Welcome to Skillora'}
            </h2>
            <p className="text-xs text-[#7A7165] mt-0.5">
              {isRegister
                ? 'Join to get your personalized learning plan'
                : 'Sign in to resume your study timetable'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A7165] hover:text-[#2C241D] rounded-xl hover:bg-[#F5F2EA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Option */}
        <div className="p-6 pb-2">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-full border border-[#D5CFBF] bg-[#F5F2EA] hover:bg-[#EBE5D8] text-[#382B21] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 fill-[#382B21]" />
            <span>1-Click Launch: Student Demo (Alex Vance)</span>
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E2D5]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#9A9184] font-semibold text-[10px] tracking-wider">Or continue with email</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>{error}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-[#2C241D] mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#9A9184] absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#2C241D] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9A9184] absolute left-3.5 top-2.5" />
              <input
                type="email"
                required
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2C241D] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9A9184] absolute left-3.5 top-2.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-[#55634E] hover:text-[#382B21] font-bold cursor-pointer"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register free"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
