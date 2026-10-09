import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Award, CheckCircle2,
  AlertTriangle, Clock, RefreshCw, Calendar, Sparkles
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { StudentPerformance, AssessmentAttempt, LearningHistoryItem } from '../types/index.ts';

export const AnalyticsView: React.FC = () => {
  const [performances, setPerformances] = useState<StudentPerformance[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [history, setHistory] = useState<LearningHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await api.getAnalytics();
        setPerformances(data.performances);
        setAttempts(data.attempts);
        setHistory(data.history);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Compiling Analytics...</h2>
        <p className="text-xs text-slate-500">Calculating historical trajectory and knowledge indices.</p>
      </div>
    );
  }

  const totalAttemptsCount = performances.reduce((acc, p) => acc + p.totalAttempts, 0);
  const totalCorrectCount = performances.reduce((acc, p) => acc + p.correctAttempts, 0);
  const overallAcc = totalAttemptsCount > 0 ? Math.round((totalCorrectCount / totalAttemptsCount) * 100) : 0;
  const avgMastery = performances.length > 0
    ? Math.round(performances.reduce((acc, p) => acc + p.masteryScore, 0) / performances.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md w-fit">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Longitudinal Performance Telemetry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Learning Analytics & Knowledge Tracking
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Visualizing your Bayesian Knowledge Tracing curve, topic retention stability, and historical attempt timelines.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Aggregate Accuracy</div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {overallAcc}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalCorrectCount} of {totalAttemptsCount} total questions
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Average BKT Mastery</div>
          <div className="text-3xl font-bold text-indigo-600 font-mono tabular-nums mt-1">
            {avgMastery}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Bayesian probability across topics
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tracked Topics</div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {performances.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Active concepts in personal graph
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Evaluation Sessions</div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {attempts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Formal diagnostics & drills
          </div>
        </div>
      </div>

      {/* Topic-Wise Accuracy & Mastery Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Topic-Wise Mastery Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Bayesian knowledge score compared with empirical answer accuracy.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Curriculum Topic</th>
                <th className="py-3 px-4 font-semibold">Subject Domain</th>
                <th className="py-3 px-4 font-semibold">Accuracy</th>
                <th className="py-3 px-4 font-semibold">BKT Mastery</th>
                <th className="py-3 px-4 font-semibold">Status Tier</th>
                <th className="py-3 px-4 font-semibold text-right">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No topic performance data logged yet. Complete the diagnostic assessment to populate.
                  </td>
                </tr>
              ) : (
                performances.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {p.topicTitle}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.subjectTitle}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {p.accuracyPercentage}%
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.masteryScore >= 75
                                ? 'bg-emerald-500'
                                : p.masteryScore >= 50
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${p.masteryScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-700 font-semibold">{p.masteryScore}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        p.status === 'mastered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'proficient'
                          ? 'bg-indigo-100 text-indigo-800'
                          : p.status === 'needs_revision'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {p.correctAttempts} / {p.totalAttempts}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Attempts Log & Learning History */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Historical Attempts */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Assessment & Diagnostic History
          </h2>

          <div className="space-y-3">
            {attempts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No assessments taken yet.
              </p>
            ) : (
              attempts.map((att) => (
                <div key={att.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block capitalize">
                      {att.assessmentType.replace('_', ' ')}
                    </span>
                    <span className="text-slate-500">
                      {new Date(att.createdAt).toLocaleString()} · {Math.round(att.durationSeconds / 60)} minutes
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 block text-sm">
                        {att.scorePercentage}%
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {att.correctCount}/{att.totalQuestions} correct
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                      {att.calculatedLevel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Learning Activity Log */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Activity History & Milestones
          </h2>

          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No recent activity logged.
              </p>
            ) : (
              history.slice(0, 6).map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-white flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {item.activityTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>+{item.pointsEarned} mastery pts</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
