import React, { useState, useEffect } from 'react';
import {
  Sparkles, Flame, Clock, Award, ArrowRight,
  CheckCircle2, Circle, BookOpen, AlertTriangle,
  Brain, BarChart3, ChevronRight, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { DashboardData, User } from '../types/index.ts';

interface DashboardViewProps {
  user: User;
  onNavigate: (view: string, params?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTimetable = async (slotId: string, currentStatus: boolean) => {
    setTogglingSlot(slotId);
    try {
      await api.toggleTimetableSlot(slotId, !currentStatus);
      if (data) {
        setData({
          ...data,
          todayTimetable: data.todayTimetable.map(slot =>
            slot.id === slotId ? { ...slot, isCompleted: !currentStatus } : slot
          )
        });
      }
    } catch (err) {
      console.error('Failed to toggle timetable slot:', err);
    } finally {
      setTogglingSlot(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Loading Student Dashboard...</h2>
        <p className="text-xs text-slate-500">Retrieving personalized metrics, Bayesian mastery scores, and schedule.</p>
      </div>
    );
  }

  const { profile, subjects, strengths, weaknesses, todayTimetable, recommendations, recentAttempts, materials } = data;

  // Next recommended action
  const primaryRecommendation = recommendations.length > 0 ? recommendations[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 1. Personalized Welcome & Top KPIs */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptive Learning Path Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user.fullName}!
            </h1>

            <p className="text-sm text-slate-600 max-w-2xl">
              Knowledge level assessed at <span className="font-semibold text-slate-900">{profile.estimatedKnowledgeLevel}</span>. Your personalized study timetable has been calibrated for {profile.preferredDailyHours}h of daily deliberate practice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('practice', { topicId: primaryRecommendation?.topicId })}
              className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('tutor')}
              className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>Ask AI Tutor</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Strips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Curriculum Mastery</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {profile.overallMasteryPercentage}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Across all selected subjects</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Active Streak</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {profile.currentStreakDays} days
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Daily review continuity</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Study Logged</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {Math.round(profile.totalStudyMinutes / 60)}h {profile.totalStudyMinutes % 60}m
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Time spent in deep focus</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>Assessed Level</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600 font-mono mt-1">
              {profile.estimatedKnowledgeLevel}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Bayesian benchmark</div>
          </div>
        </div>
      </section>

      {/* 2. Today's Personalized Timetable & Immediate Recommendations */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Today's Timetable */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Today's Personalized Study Timetable
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured into 45-minute focus intervals calibrated to your retention curve.
              </p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Week</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayTimetable.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No sessions scheduled for today. Take a quick quiz or regenerate timetable.
              </div>
            ) : (
              todayTimetable.map((slot) => {
                const isToggling = togglingSlot === slot.id;
                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      slot.isCompleted
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleTimetable(slot.id, slot.isCompleted)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                      >
                        {slot.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-slate-600">
                            {slot.timeSlot}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                            slot.activityType === 'revision'
                              ? 'text-amber-700'
                              : slot.activityType === 'practice_drill'
                              ? 'text-indigo-700'
                              : 'text-slate-600'
                          }`}>
                            {slot.activityType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className={`text-sm font-semibold truncate mt-0.5 ${
                          slot.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}>
                          {slot.topicTitle}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('practice', { topicId: slot.topicId })}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Start Session
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Priority Recommendations */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              AI Pedagogical Recommendations
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Prioritized by BKT
            </span>
          </div>

          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Great job! No pending revision flags. Continue with regular curriculum drills.
              </div>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    rec.recommendationType === 'urgent_revision'
                      ? 'border-amber-200 bg-amber-50/50 text-amber-950'
                      : 'border-slate-200 bg-slate-50/60 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {rec.topicTitle}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      rec.recommendationType === 'urgent_revision'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {rec.recommendationType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rec.reason}
                  </p>
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => onNavigate('practice', { topicId: rec.topicId })}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Launch Revision Drill</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Strengths vs Weaknesses (Topics needing improvement) */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Strongest Topics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Top Mastered Topics (Strengths)
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
              ≥ 75% Mastery
            </span>
          </div>

          <div className="space-y-3">
            {strengths.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Keep practicing to achieve high confidence and unlock your first Mastered badge!
              </p>
            ) : (
              strengths.map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-900">{s.topicTitle}</span>
                    <span className="font-mono text-emerald-700">{s.accuracyPercentage}% Accuracy</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${s.masteryScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{s.correctAttempts}/{s.totalAttempts} correct answers</span>
                    <span className="capitalize">{s.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Needs Immediate Revision (Weaknesses)
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded">
              &lt; 55% Retention
            </span>
          </div>

          <div className="space-y-3">
            {weaknesses.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No weak topics detected. Your baseline retention across all modules is steady!
              </p>
            ) : (
              weaknesses.map((w) => (
                <div key={w.id} className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-900">{w.topicTitle}</span>
                    <span className="font-mono text-amber-700">{w.accuracyPercentage}% Accuracy</span>
                  </div>
                  <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${w.masteryScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>{w.correctAttempts}/{w.totalAttempts} correct answers</span>
                    <button
                      onClick={() => onNavigate('practice', { topicId: w.topicId })}
                      className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Re-drill Now →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Subject-Wise Progress Bars */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Subject Mastery Calibration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous weighted index tracking across all core modules.
            </p>
          </div>
          <button
            onClick={() => onNavigate('materials')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore Curriculum</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onNavigate('materials', { subjectId: sub.id })}
              className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50/50 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {sub.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {sub.title}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {sub.masteryPercentage}%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${sub.masteryPercentage}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{sub.topicsCount} Curriculum Topics</span>
                <span className="font-medium text-slate-700">Open Notes →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recommended Learning Materials */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Curated Concept Notes & Explanations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Read high-yield breakdowns with mathematical formulas and algorithms.
            </p>
          </div>
          <button
            onClick={() => onNavigate('materials')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>All Materials</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {materials.map((mat) => (
            <div
              key={mat.id}
              onClick={() => onNavigate('materials', { topicId: mat.topicId })}
              className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{mat.readingTimeMinutes} min read</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {mat.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {mat.summary}
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-indigo-600 font-semibold">Study Notes</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Recent Quiz Scores */}
      {recentAttempts.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Assessment & Drill Attempts
            </h2>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block capitalize">
                    {attempt.assessmentType.replace('_', ' ')}
                  </span>
                  <span className="text-slate-500">
                    {new Date(attempt.createdAt).toLocaleDateString()} · {Math.round(attempt.durationSeconds / 60)} mins
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {attempt.scorePercentage}%
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {attempt.calculatedLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
