import React, { useState } from 'react';
import {
  BookOpen, LayoutDashboard, MessageSquareText,
  BrainCircuit, Calendar, BarChart3,
  Settings, LogOut, Wifi, WifiOff, Bell, Sparkles
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
  onOpenGitHubModal?: () => void;
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
  onOpenGitHubModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  // Compute initials for the user badge (like "PK" in the screenshot)
  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F5F2EA]/95 backdrop-blur-md border-b border-[#E8E2D5]/70 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          {/* Zone 1: Single element wordmark with the signature book square */}
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E0D4] flex items-center justify-center text-[#3D352B] shadow-xs group-hover:border-[#55634E] group-hover:text-[#55634E] transition-all">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#2C241D] whitespace-nowrap">
              Skillora
            </span>
          </button>

          {/* Zone 2: Navigation Links */}
          {user ? (
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#665D53]">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'text-[#2C241D] font-bold'
                    : 'hover:text-[#2C241D]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('notes')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'notes'
                    ? 'text-[#2C241D] font-bold'
                    : 'hover:text-[#2C241D]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#55634E]" />
                <span>Study Notes</span>
              </button>

              <button
                onClick={() => onNavigate('tutor')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'tutor'
                    ? 'text-[#2C241D] font-bold'
                    : 'hover:text-[#2C241D]'
                }`}
              >
                <MessageSquareText className="w-4 h-4" />
                <span>AI Tutor</span>
              </button>

              <button
                onClick={() => onNavigate('materials')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'materials'
                    ? 'text-[#2C241D] font-bold'
                    : 'hover:text-[#2C241D]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Curriculum</span>
              </button>

              <button
                onClick={() => onNavigate('practice')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'practice'
                    ? 'text-[#2C241D] font-bold'
                    : 'hover:text-[#2C241D]'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Practice</span>
              </button>

              <button
                onClick={() => onNavigate('timetable')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'timetable'
                    ? 'text-[#2C241D] font-bold'
                    : 'hover:text-[#2C241D]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Timetable</span>
              </button>

              <button
                onClick={() => onNavigate('analytics')}
                className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'analytics'
                    ? 'text-[#2C241D] font-bold'
                    : 'hover:text-[#2C241D]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#665D53]">
              <a href="#how-it-works" className="hover:text-[#2C241D] transition-colors whitespace-nowrap shrink-0">
                How It Works
              </a>
              <a href="#curriculum" className="hover:text-[#2C241D] transition-colors whitespace-nowrap shrink-0">
                Curriculum
              </a>
              <a href="#methodology" className="hover:text-[#2C241D] transition-colors whitespace-nowrap shrink-0">
                Methodology
              </a>
              <a href="#offline-first" className="hover:text-[#2C241D] transition-colors whitespace-nowrap shrink-0">
                Offline Privacy
              </a>
            </nav>
          )}

          {/* Zone 3: Notification Bell & User Avatar Pill (Matching uploaded mockup) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* GitHub Sync Button */}
            <button
              onClick={onOpenGitHubModal}
              title="Sync & Push to GitHub repository"
              className="py-2 px-3 rounded-2xl text-xs font-bold border border-[#E5E0D4] bg-white hover:bg-[#FAF8F5] text-[#2C241D] transition-all flex items-center gap-2 shadow-2xs cursor-pointer group"
            >
              <svg className="w-4 h-4 fill-current text-[#2C241D] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
              <span className="w-2 h-2 rounded-full bg-[#55634E]" title="Ready to push" />
            </button>

            {/* Offline simulation pill */}
            <button
              onClick={onToggleOffline}
              title={isOffline ? 'Simulating offline disconnected state' : 'Connected to backend service'}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isOffline
                  ? 'bg-[#EAE4D6] text-[#7A6038] border-[#DFD7C5]'
                  : 'bg-white/80 text-[#6B6154] border-[#E5E0D4] hover:bg-white'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-700" /> : <Wifi className="w-3.5 h-3.5 text-[#55634E]" />}
              <span className="hidden sm:inline">{isOffline ? 'Offline' : 'Online'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {/* Bell notification button matching mockup */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-10 h-10 rounded-2xl bg-white border border-[#E5E0D4] hover:border-[#D5CFBE] flex items-center justify-center text-[#3D352B] shadow-xs transition-colors cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4 stroke-[2]" />
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E8E2D5] shadow-lg p-4 space-y-2 z-50 text-xs">
                      <div className="font-bold text-[#2C241D] border-b border-[#F0EBE0] pb-2">
                        Study Notifications
                      </div>
                      <div className="text-[#665D53] py-1">
                        🎯 Next task: <span className="font-semibold text-[#2C241D]">DBMS Normalization Drill</span> scheduled for today.
                      </div>
                      <div className="text-[#665D53] py-1">
                        🔥 5-day streak maintained! Keep up the momentum.
                      </div>
                    </div>
                  )}
                </div>

                {/* User avatar badge with initials (like "PK" in mockup) */}
                <button
                  onClick={() => onNavigate('settings')}
                  className="w-10 h-10 rounded-2xl bg-[#382C22] hover:bg-[#2C221A] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs transition-all cursor-pointer"
                  title={`${user.fullName} (${user.email})`}
                >
                  {getInitials(user.fullName)}
                </button>

                {/* Settings & Sign Out */}
                <button
                  onClick={() => onNavigate('settings')}
                  className={`w-9 h-9 rounded-xl text-[#665D53] hover:text-[#2C241D] hover:bg-white transition-colors flex items-center justify-center cursor-pointer ${
                    currentView === 'settings' ? 'bg-white text-[#2C241D]' : ''
                  }`}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={onLogout}
                  className="w-9 h-9 rounded-xl text-[#7A7165] hover:text-red-700 hover:bg-red-50/60 transition-colors flex items-center justify-center cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-5 py-2 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-2xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
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
