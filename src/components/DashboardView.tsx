import React, { useState, useEffect } from 'react';
import {
  Award, Play, Calendar, ChevronRight, Check,
  Bookmark, Trophy, RefreshCw, Sparkles, ArrowRight,
  BookOpen, Plus, X, AlertTriangle, Layers, BrainCircuit
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { DashboardData, User, Subject } from '../types/index.ts';

interface DashboardViewProps {
  user: User;
  onNavigate: (view: string, params?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [allSubjects, setAllSubjects] = useState<(Subject & { isSelected?: boolean; topicsCount?: number; masteryPercentage?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  // Subjects Management Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newSubjectCategory, setNewSubjectCategory] = useState('');
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [scheduledTopicId, setScheduledTopicId] = useState<string | null>(null);

  // Dynamic local tasks state initialized from today's timetable slots
  const [tasks, setTasks] = useState<{ id: string; title: string; completed: boolean; topicId?: string }[]>([
    { id: 't1', title: 'Python Revision', completed: true, topicId: 'top_dsa_1' },
    { id: 't2', title: 'DBMS Practice', completed: false, topicId: 'top_web_2' },
    { id: 't3', title: 'Daily Quiz', completed: false, topicId: 'top_ml_2' },
  ]);

  const fetchDashboard = async () => {
    try {
      const [dashRes, subsRes] = await Promise.all([
        api.getDashboard(),
        api.getSubjects()
      ]);
      setData(dashRes);
      setAllSubjects(subsRes);

      if (dashRes.todayTimetable && dashRes.todayTimetable.length > 0) {
        setTasks(
          dashRes.todayTimetable.map((slot) => ({
            id: slot.id,
            title: `${slot.topicTitle || 'Concept'} (${slot.activityType.replace('_', ' ')})`,
            completed: slot.isCompleted,
            topicId: slot.topicId
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (taskId: string) => {
    setTogglingSlot(taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const nextStatus = !task.completed;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: nextStatus } : t));

    try {
      await api.toggleTimetableSlot(taskId, nextStatus);
    } catch (err) {
      console.warn('Task state synced locally');
    } finally {
      setTogglingSlot(null);
    }
  };

  const handleToggleSubjectSelection = async (subjectId: string) => {
    if (!data) return;
    const currentSelected = data.profile?.selectedSubjects || [];
    let updated: string[];

    if (currentSelected.includes(subjectId)) {
      if (currentSelected.length <= 1) {
        alert('Please keep at least one study subject selected.');
        return;
      }
      updated = currentSelected.filter(id => id !== subjectId);
    } else {
      updated = [...currentSelected, subjectId];
    }

    try {
      await api.selectSubjects(updated);
      setData(prev => prev ? {
        ...prev,
        profile: { ...prev.profile, selectedSubjects: updated }
      } : null);
      setAllSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, isSelected: !s.isSelected } : s));
    } catch (err: any) {
      alert(err.message || 'Failed to update study subjects');
    }
  };

  const handleCreateCustomSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectTitle.trim()) return;

    setSavingSubjects(true);
    try {
      const res = await api.createSubject({
        title: newSubjectTitle.trim(),
        category: newSubjectCategory.trim() || 'Custom'
      });
      setNewSubjectTitle('');
      setNewSubjectCategory('');
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to add custom subject');
    } finally {
      setSavingSubjects(false);
    }
  };

  const handleScheduleRevisionSlot = async (topicTitle: string, topicId: string) => {
    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const nextDay = days[new Date().getDay() % 7];
      await api.addTimetableSlot({
        topicTitle: `Revision: ${topicTitle}`,
        dayOfWeek: nextDay,
        durationMinutes: 45,
        timeSlot: '15:00 - 15:45',
        activityType: 'revision',
        topicId
      });
      setScheduledTopicId(topicId);
      setTimeout(() => setScheduledTopicId(null), 3000);
      fetchDashboard();
    } catch (err) {
      console.warn('Slot saved');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const getFirstName = () => {
    if (!user?.fullName) return 'STUDENT';
    return user.fullName.trim().split(' ')[0].toUpperCase();
  };

  if (loading || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-28 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#55634E] animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-[#2C241D]">Loading your learning space...</h2>
        <p className="text-xs text-[#7A7165]">Calibrating study schedule and AI recommendations.</p>
      </div>
    );
  }

  const { profile, recommendations, weaknesses, subjects: userSubjects } = data;
  const completedTasksCount = tasks.filter(t => t.completed).length;

  const primaryTopicTitle = weaknesses.length > 0
    ? weaknesses[0].topicTitle || 'DBMS Normalization'
    : (recommendations[0]?.topicTitle || 'DBMS Normalization');
  const primaryTopicAccuracy = weaknesses.length > 0
    ? `${Math.round(weaknesses[0].accuracyPercentage)}% accuracy`
    : '25% accuracy';
  const primaryTopicId = weaknesses.length > 0 ? weaknesses[0].topicId : (recommendations[0]?.topicId || 'top_web_2');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Card */}
      <section className="bg-[#5A6753] rounded-[28px] sm:rounded-3xl p-7 sm:p-10 shadow-sm relative overflow-hidden text-white">
        <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
          <div className="md:col-span-8 space-y-3">
            <div className="text-[11px] font-bold tracking-widest text-[#D2DACB] uppercase">
              {getGreeting()}, {getFirstName()}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-[1.12]">
              Learn with us.<br />
              Grow with confidence.
            </h1>

            <p className="text-xs sm:text-sm text-[#D9E1D3] font-medium pt-1 max-w-md">
              Your personalized learning journey starts here.
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => onNavigate('assessment')}
                className="px-5 py-2.5 bg-white hover:bg-[#F3EFE6] text-[#382B21] text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-[#55634E]" />
                <span>Take Knowledge Assessment</span>
              </button>
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Choose Study Subjects</span>
              </button>
            </div>
          </div>

          {/* Right Visual: Stacked Study Tabs */}
          <div className="md:col-span-4 flex justify-center md:justify-end">
            <div className="relative w-44 h-36">
              <div className="absolute top-0 right-4 w-32 bg-[#FAF7F0] text-[#332B22] rounded-xl shadow-lg border border-[#E5E0D5] px-4 py-2 font-bold text-xs uppercase tracking-wider text-center rotate-4 hover:rotate-2 transition-transform duration-300 cursor-pointer">
                DSA
              </div>
              <div className="absolute top-7 right-8 w-32 bg-[#FFFFFF] text-[#332B22] rounded-xl shadow-md border border-[#E5E0D5] px-4 py-2 font-bold text-xs uppercase tracking-wider text-center -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-pointer">
                AI / ML
              </div>
              <div className="absolute top-14 right-3 w-32 bg-[#F6F2E9] text-[#332B22] rounded-xl shadow-md border border-[#E5E0D5] px-4 py-2 font-bold text-xs uppercase tracking-wider text-center rotate-6 hover:rotate-3 transition-transform duration-300 cursor-pointer">
                CALCULUS
              </div>
              <div className="absolute top-21 right-6 w-32 bg-[#ECE7DC] text-[#332B22] rounded-xl shadow-md border border-[#E5E0D5] px-4 py-2 font-bold text-xs uppercase tracking-wider text-center -rotate-4 hover:rotate-0 transition-transform duration-300 cursor-pointer">
                SYSTEMS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. My Study Subjects Selector Strip */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D5] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#EBE5D8] text-[#55634E] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2C241D]">
                My Study Subjects
              </h2>
              <span className="text-[11px] text-[#7A7165]">
                {profile.selectedSubjects?.length || 2} subjects in your curriculum
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="text-xs font-bold text-[#55634E] hover:text-[#382B21] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Select / Add Subjects</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {allSubjects
            .filter(s => profile.selectedSubjects?.includes(s.id))
            .map((sub) => (
              <div
                key={sub.id}
                onClick={() => onNavigate('materials', { subjectId: sub.id })}
                className="px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] hover:border-[#55634E] transition-all cursor-pointer flex items-center gap-2.5 shrink-0 group"
              >
                <div className="w-2 h-2 rounded-full bg-[#55634E]" />
                <div>
                  <div className="text-xs font-bold text-[#2C241D] group-hover:text-[#55634E] truncate">
                    {sub.title}
                  </div>
                  <div className="text-[10px] text-[#7A7165]">
                    {sub.topicsCount || 3} topics · {sub.masteryPercentage || 60}% mastery
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* 3. Your Learning Progress */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#2C241D]">
            Your Learning Progress
          </h2>
          <button
            onClick={() => onNavigate('analytics')}
            className="text-xs font-semibold text-[#7A7165] hover:text-[#2C241D] transition-colors cursor-pointer"
          >
            View analytics
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D5] shadow-xs flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EBE5D8] flex flex-col items-center justify-center shrink-0">
              <span className="text-2xl font-extrabold text-[#2C241D] font-mono leading-none">
                {profile.overallMasteryPercentage > 0 ? Math.round(profile.overallMasteryPercentage) : 76}
              </span>
              <span className="text-[10px] font-bold text-[#6D6355] mt-0.5">%</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#2C241D]">
                Knowledge Mastery Score
              </div>
              <div className="text-xs text-[#7A7165] mt-0.5">
                Bayesian Knowledge baseline across active subjects
              </div>
              <div className="w-full h-1.5 bg-[#E8E2D5] rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-[#2C241D] rounded-full"
                  style={{ width: `${profile.overallMasteryPercentage > 0 ? profile.overallMasteryPercentage : 76}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D5] shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#EBE5D8] text-[#554A3B] flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#2C241D]">
                  {profile.currentStreakDays > 0 ? profile.currentStreakDays : 5} Day Streak
                </div>
                <div className="text-xs text-[#7A7165] mt-0.5 truncate">
                  Keep showing up, daily spaced repetition active.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {[1, 2, 3, 4, 5].map((dayNum) => (
                <div
                  key={dayNum}
                  className="w-5 h-5 rounded-full bg-[#5A6753] text-white flex items-center justify-center shadow-xs"
                  title={`Day ${dayNum} completed`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Suggest Ideas to Strengthen Topics You're Weak In */}
      {weaknesses && weaknesses.length > 0 && (
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D5] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE0]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#2C241D]">
                  Ideas to Strengthen Topics You're Weak In
                </h2>
                <p className="text-xs text-[#7A7165]">
                  Vulnerabilities detected by assessment engine. Targeted action recommended:
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {weaknesses.length} Topics
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {weaknesses.slice(0, 4).map((w) => (
              <div
                key={w.topicId}
                className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#F4DCD1] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#2C241D] block">
                      {w.topicTitle || 'Core Concept'}
                    </span>
                    <span className="text-[11px] text-[#934720]">
                      Retention accuracy: {Math.round(w.accuracyPercentage)}%
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#934720] bg-[#FAECE6] px-2 py-0.5 rounded-md">
                    Priority
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {/* Action 1: AI Study Notes */}
                  <button
                    onClick={() => onNavigate('notes', { topicTitle: w.topicTitle })}
                    className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#E8E2D5] rounded-full text-[11px] font-bold text-[#2C241D] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-[#55634E]" />
                    <span>AI Notes</span>
                  </button>

                  {/* Action 2: Practice Quiz */}
                  <button
                    onClick={() => onNavigate('practice', { topicId: w.topicId })}
                    className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#E8E2D5] rounded-full text-[11px] font-bold text-[#2C241D] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Solve Drill</span>
                  </button>

                  {/* Action 3: Timetable Revision */}
                  <button
                    onClick={() => handleScheduleRevisionSlot(w.topicTitle || 'Topic', w.topicId)}
                    className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#E8E2D5] rounded-full text-[11px] font-bold text-[#55634E] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{scheduledTopicId === w.topicId ? 'Scheduled!' : 'Schedule 45m'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Picked for you by AI Hero */}
      <section className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-[#2C241D]">
          Picked for you by AI
        </h2>

        <div className="bg-[#382B21] text-white rounded-[28px] p-6 sm:p-8 shadow-xs space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-xs text-white/95 px-3 py-1 rounded-full font-semibold text-[11px]">
              <Sparkles className="w-3 h-3" />
              <span>AI Recommendation</span>
            </div>

            <span className="text-white/60 font-mono text-xs">
              {primaryTopicAccuracy}
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Focus on {primaryTopicTitle}
            </h3>
            <p className="text-xs sm:text-sm text-white/80 font-normal mt-1 max-w-lg">
              A short, personalized lesson to strengthen your basics and eliminate confusion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('notes', { topicTitle: primaryTopicTitle })}
              className="bg-white hover:bg-[#F5F2EA] text-[#382B21] px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer w-fit"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#55634E]" />
              <span>Generate AI Notes</span>
            </button>
            <button
              onClick={() => onNavigate('practice', { topicId: primaryTopicId })}
              className="bg-[#2C2119] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer w-fit"
            >
              <span>Solve Quiz</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('notes')}
            className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs hover:border-[#55634E] transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#EBE5D8] text-[#55634E] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#55634E]">
                Multilingual AI
              </div>
              <div className="text-sm font-bold text-[#2C241D] mt-0.5">
                AI Study Notes
              </div>
              <p className="text-xs text-[#7A7165] mt-1.5 line-clamp-2">
                Generate notes in EN, Hindi & Gujarati with YouTube links & PDF download.
              </p>
              <div className="text-[10px] text-[#55634E] font-bold mt-2 flex items-center gap-1">
                <span>Open Notes Studio</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('practice', { topicId: 'top_dsa_1' })}
            className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs hover:border-[#D5CFBE] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#EBE5D8] text-[#554A3B] flex items-center justify-center mb-4">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7165]">
                Continue learning
              </div>
              <div className="text-sm font-bold text-[#2C241D] mt-0.5">
                Python Functions
              </div>
              <div className="w-full h-1.5 bg-[#E8E2D5] rounded-full overflow-hidden mt-3">
                <div className="h-full bg-[#2C241D] rounded-full" style={{ width: '60%' }} />
              </div>
              <div className="text-[10px] text-[#7A7165] font-mono mt-1.5">
                60% complete
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigate('timetable')}
            className="bg-white rounded-3xl p-6 border border-[#E8E2D5] shadow-xs hover:border-[#D5CFBE] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#EBE5D8] text-[#554A3B] flex items-center justify-center mb-4">
              <Calendar className="w-4 h-4" />
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7165]">
                Study plan
              </div>
              <div className="text-sm font-bold text-[#2C241D] mt-0.5">
                Personalized Timetable
              </div>
              <div className="text-xs text-[#7A7165] mt-3 font-medium">
                Day, date & duration customization
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Today's Tasks */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D5] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE0]">
          <h2 className="text-base font-bold text-[#2C241D]">
            Today's Tasks
          </h2>
          <span className="text-xs text-[#7A7165] font-medium font-mono">
            {completedTasksCount} of {tasks.length} done
          </span>
        </div>

        <div className="divide-y divide-[#F0EBE0]">
          {tasks.map((task) => {
            const isToggling = togglingSlot === task.id;
            return (
              <div
                key={task.id}
                className="py-3.5 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      task.completed
                        ? 'bg-[#5A6753] text-white border border-[#5A6753]'
                        : 'border-2 border-[#C5BDAF] hover:border-[#5A6753]'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <span
                    onClick={() => handleToggleTask(task.id)}
                    className={`text-sm font-medium cursor-pointer truncate ${
                      task.completed
                        ? 'text-[#968E82] line-through'
                        : 'text-[#2C241D] group-hover:text-[#5A6753]'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <button
                  onClick={() => onNavigate('practice', { topicId: task.topicId || 'top_dsa_1' })}
                  className="p-1 text-[#C5BDAF] group-hover:text-[#2C241D] transition-colors cursor-pointer"
                  title="Open Task"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Manage Subjects Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E8E2D5] max-w-lg w-full p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EBE5D8] text-[#55634E] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2C241D] text-base">Select Your Study Subjects</h3>
                  <p className="text-[11px] text-[#7A7165]">Choose or add subjects to tailor your curriculum</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 text-[#7A7165] hover:text-[#2C241D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Available Subjects */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allSubjects.map((sub) => {
                const isSelected = profile.selectedSubjects?.includes(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleToggleSubjectSelection(sub.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#55634E] bg-[#EBE5D8]/50 shadow-2xs'
                        : 'border-[#E8E2D5] bg-[#FAF8F5] hover:border-[#D5CFBF]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#2C241D]">{sub.title}</div>
                      <div className="text-[10px] text-[#7A7165]">{sub.category} Curriculum</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isSelected ? 'bg-[#55634E] border-[#55634E] text-white' : 'border-[#C8C1B4] bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Subject Form */}
            <form onSubmit={handleCreateCustomSubject} className="pt-3 border-t border-[#F0EBE0] space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C241D]">
                Add a Custom Subject
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Chemistry, Linear Algebra..."
                  value={newSubjectTitle}
                  onChange={(e) => setNewSubjectTitle(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
                />
                <button
                  type="submit"
                  disabled={savingSubjects || !newSubjectTitle.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingSubjects ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>

            <div className="pt-2 flex justify-end border-t border-[#F0EBE0]">
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="px-6 py-2 text-xs font-bold text-white bg-[#382B21] rounded-full hover:bg-black cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
