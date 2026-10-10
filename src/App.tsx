import React, { useState, useEffect } from 'react';
import { api } from './lib/api.ts';
import { User, StudentProfile } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { OnboardingView } from './components/OnboardingView.tsx';
import { AssessmentView } from './components/AssessmentView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { AITutorView } from './components/AITutorView.tsx';
import { LearningMaterialsView } from './components/LearningMaterialsView.tsx';
import { PracticeQuizView } from './components/PracticeQuizView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { TimetableView } from './components/TimetableView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { NotesGeneratorView } from './components/NotesGeneratorView.tsx';
import { GitHubModal } from './components/GitHubModal.tsx';
import { WifiOff } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [viewParams, setViewParams] = useState<any>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Load existing session on boot
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = api.getToken();
        if (token) {
          const res = await api.getMe();
          setUser(res.user);
          setProfile(res.profile);
          if (res.profile && !res.profile.onboardingCompleted) {
            setCurrentView('onboarding');
          } else if (res.profile && !res.profile.initialAssessmentCompleted) {
            setCurrentView('assessment');
          } else {
            setCurrentView('dashboard');
          }
        }
      } catch (err) {
        console.warn('Session expired or offline; resetting auth token');
        api.logout();
      } finally {
        setInitializing(false);
      }
    }
    restoreSession();
  }, []);

  const handleNavigate = (view: string, params?: any) => {
    setViewParams(params || {});
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (u: User, p: StudentProfile) => {
    setUser(u);
    setProfile(p);
    setIsAuthModalOpen(false);
    if (!p || !p.onboardingCompleted) {
      handleNavigate('onboarding');
    } else if (!p.initialAssessmentCompleted) {
      handleNavigate('assessment');
    } else {
      handleNavigate('dashboard');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setProfile(null);
    handleNavigate('landing');
  };

  const toggleOfflineSimulation = () => {
    const next = !isOffline;
    setIsOffline(next);
    api.setOfflineOverride(next);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#55634E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#7A7165] uppercase tracking-wider">
            Initializing Skillora Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EA] flex flex-col text-[#2C241D]">
      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-[#EBE3D0] text-[#634E28] border-b border-[#DCD3BE] px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-700" />
          <span>Offline Simulation Mode Active: Using on-device storage and local deterministic knowledge engine.</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        profile={profile}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isOffline={isOffline}
        onToggleOffline={toggleOfflineSimulation}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
      />

      {/* Primary View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onStart={() => {
              if (user) {
                handleNavigate(profile?.initialAssessmentCompleted ? 'dashboard' : 'assessment');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            onDemo={async () => {
              try {
                const res = await api.loginDemo();
                handleAuthSuccess(res.user, res.profile);
              } catch (err) {
                console.error(err);
              }
            }}
          />
        )}

        {currentView === 'onboarding' && user && (
          <OnboardingView
            user={user}
            onCompleted={(p) => {
              setProfile(p);
              handleNavigate('assessment');
            }}
          />
        )}

        {currentView === 'assessment' && (
          <AssessmentView
            assessmentType={viewParams.assessmentType || "initial_diagnostic"}
            subjectId={viewParams.subjectId}
            onComplete={() => handleNavigate('dashboard')}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'dashboard' && user && (
          <DashboardView
            user={user}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'notes' && (
          <NotesGeneratorView
            initialTopic={viewParams.topicTitle || viewParams.topicId}
            initialLanguage={viewParams.language}
            initialDifficulty={viewParams.difficulty}
            user={user}
            profile={profile}
            isOffline={isOffline}
            onNavigateToPractice={(tId) => handleNavigate('practice', { topicId: tId })}
            onNavigateToTutor={(tId) => handleNavigate('tutor', { topicId: tId })}
          />
        )}

        {currentView === 'tutor' && (
          <AITutorView
            initialTopicId={viewParams.topicId}
            onNavigateToPractice={(tId) => handleNavigate('practice', { topicId: tId })}
          />
        )}

        {currentView === 'materials' && (
          <LearningMaterialsView
            initialSubjectId={viewParams.subjectId}
            initialTopicId={viewParams.topicId}
            onNavigateToPractice={(tId) => handleNavigate('practice', { topicId: tId })}
            onNavigateToTutor={(tId) => handleNavigate('tutor', { topicId: tId })}
          />
        )}

        {currentView === 'practice' && (
          <PracticeQuizView
            initialTopicId={viewParams.topicId}
            onNavigateToTutor={(tId) => handleNavigate('tutor', { topicId: tId })}
            onNavigateToDashboard={() => handleNavigate('dashboard')}
            onNavigateToNotes={(tTitle) => handleNavigate('notes', { topicTitle: tTitle })}
          />
        )}

        {currentView === 'timetable' && (
          <TimetableView
            onNavigateToPractice={(tId) => handleNavigate('practice', { topicId: tId })}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView />
        )}

        {currentView === 'settings' && user && profile && (
          <SettingsView
            user={user}
            profile={profile}
            onProfileUpdated={(p) => setProfile(p)}
            onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* GitHub Sync & Export Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />
    </div>
  );
}
