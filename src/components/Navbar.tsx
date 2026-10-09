import React from 'react';
import {
  GraduationCap, LayoutDashboard, MessageSquareText,
  BookOpen, BrainCircuit, Calendar, BarChart3,
  Settings, LogOut, Wifi, WifiOff, Sparkles
} from 'lucide-react';
import { User, StudentProfile } from '../types/index.ts';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User | null;
  profile: StudentProfile | null;
  onLoginClick: () => void;
  onLogout: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  user,
  profile,
  onLoginClick,
  onLogout,
  isOffline,
  onToggleOffline,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single element wordmark */}
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-2 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              Skillora
            </span>
          </button>

          {/* Zone 2: 4-5 concise single-line nav links */}
          {user ? (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'dashboard'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('tutor')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'tutor'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                <MessageSquareText className="w-4 h-4" />
                <span>AI Tutor</span>
              </button>

              <button
                onClick={() => onNavigate('materials')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'materials'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Curriculum</span>
              </button>

              <button
                onClick={() => onNavigate('practice')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'practice'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Practice & Quiz</span>
              </button>

              <button
                onClick={() => onNavigate('timetable')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'timetable'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Timetable</span>
              </button>

              <button
                onClick={() => onNavigate('analytics')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'analytics'
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#how-it-works" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
                How It Works
              </a>
              <a href="#curriculum" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
                Curriculum
              </a>
              <a href="#methodology" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
                Methodology
              </a>
              <a href="#offline-first" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
                Offline Privacy
              </a>
            </nav>
          )}

          {/* Zone 3: 1 primary action or student status */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Offline simulation toggle */}
            <button
              onClick={onToggleOffline}
              title={isOffline ? 'Simulating offline disconnected state' : 'Connected to backend service'}
              className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isOffline
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-600" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="hidden sm:inline">{isOffline ? 'Offline Mode' : 'Online'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('settings')}
                  className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                    currentView === 'settings' ? 'bg-slate-100 text-slate-900' : ''
                  }`}
                  title="Profile & AI Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
