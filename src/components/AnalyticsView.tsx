import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Award, CheckCircle2,
  AlertTriangle, Clock, RefreshCw, Calendar, Sparkles,
  BookOpen, Play, ChevronRight, X, ArrowUpRight
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { StudentPerformance, AssessmentAttempt, LearningHistoryItem } from '../types/index.ts';

export const AnalyticsView: React.FC = () => {
  const [performances, setPerformances] = useState<StudentPerformance[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [history, setHistory] = useState<LearningHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<AssessmentAttempt | null>(null);

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
        <RefreshCw className="w-8 h-8 text-[#55634E] animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-[#2C241D]">Compiling Analytics...</h2>
        <p className="text-xs text-[#7A7165]">Calculating historical trajectory and knowledge indices.</p>
      </div>
    );
  }

  const totalAttemptsCount = performances.reduce((acc, p) => acc + p.totalAttempts, 0);
  const totalCorrectCount = performances.reduce((acc, p) => acc + p.correctAttempts, 0);
  const overallAcc = totalAttemptsCount > 0 ? Math.round((totalCorrectCount / totalAttemptsCount) * 100) : 0;
  const avgMastery = performances.length > 0
    ? Math.round(performances.reduce((acc, p) => acc + p.masteryScore, 0) / performances.length)
    : 0;

  // Strengths & Weaknesses
  const strengths = performances.filter(p => p.accuracyPercentage >= 70 || p.masteryScore >= 75);
  const weaknesses = performances.filter(p => p.accuracyPercentage < 55 || p.status === 'needs_revision');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-[#4D5A46] bg-[#E9E4D6] px-3.5 py-1.5 rounded-full w-fit">
          <BarChart3 className="w-3.5 h-3.5 text-[#55634E]" />
          <span>Longitudinal Performance Telemetry & Quiz Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C241D] tracking-tight">
          Learning Analytics & Knowledge Tracking
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6256] max-w-2xl font-medium">
          Visualizing your Bayesian Knowledge Tracing curve, topic retention stability, and quiz attempt analytics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 sm:p-6 shadow-xs">
          <div className="text-xs text-[#7A7165] font-semibold">Aggregate Accuracy</div>
          <div className="text-3xl font-bold text-[#2C241D] font-mono tabular-nums mt-1">
            {overallAcc}%
          </div>
          <div className="text-[11px] text-[#8A8174] mt-1 font-medium">
            {totalCorrectCount} of {totalAttemptsCount} total questions
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 sm:p-6 shadow-xs">
          <div className="text-xs text-[#7A7165] font-semibold">Average BKT Mastery</div>
          <div className="text-3xl font-bold text-[#55634E] font-mono tabular-nums mt-1">
            {avgMastery}%
          </div>
          <div className="text-[11px] text-[#8A8174] mt-1 font-medium">
            Bayesian probability across topics
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 sm:p-6 shadow-xs">
          <div className="text-xs text-[#7A7165] font-semibold">Tracked Concepts</div>
          <div className="text-3xl font-bold text-[#2C241D] font-mono tabular-nums mt-1">
            {performances.length}
          </div>
          <div className="text-[11px] text-[#8A8174] mt-1 font-medium">
            {strengths.length} strengths · {weaknesses.length} weak gaps
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5 sm:p-6 shadow-xs">
          <div className="text-xs text-[#7A7165] font-semibold">Evaluation Sessions</div>
          <div className="text-3xl font-bold text-[#2C241D] font-mono tabular-nums mt-1">
            {attempts.length}
          </div>
          <div className="text-[11px] text-[#8A8174] mt-1 font-medium">
            Diagnostics & practice quizzes
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE0]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#E3EBE0] text-[#3A4D33] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-[#2C241D] text-sm">
                Strengths Identified ({strengths.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#55634E] bg-[#E9E4D6] px-2.5 py-0.5 rounded-full">
              Solid Foundation
            </span>
          </div>

          <div className="space-y-2">
            {strengths.length === 0 ? (
              <p className="text-xs text-[#7A7165] py-4 text-center">No mastered topics yet.</p>
            ) : (
              strengths.slice(0, 5).map(s => (
                <div key={s.id} className="p-3 bg-[#FAF8F5] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#2C241D]">{s.topicTitle}</span>
                    <span className="text-[10px] text-[#7A7165] block">{s.subjectTitle}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#3A4D33]">{s.accuracyPercentage}%</span>
                    <span className="text-[10px] text-[#55634E] block">{s.masteryScore}% BKT</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weaknesses with Suggestions */}
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE0]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-[#2C241D] text-sm">
                Weaknesses & Ideas to Strengthen ({weaknesses.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Needs Revision
            </span>
          </div>

          <div className="space-y-2">
            {weaknesses.length === 0 ? (
              <p className="text-xs text-[#3A4D33] font-bold py-4 text-center">No active weakness vulnerabilities found!</p>
            ) : (
              weaknesses.slice(0, 4).map(w => (
                <div key={w.id} className="p-3 bg-[#FFF8F5] border border-[#F4DCD1] rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2C241D]">{w.topicTitle}</span>
                    <span className="text-[10px] font-bold text-[#934720]">{w.accuracyPercentage}% retention</span>
                  </div>
                  <p className="text-[11px] text-[#7A7165]">
                    Recommended Idea: Review basic invariants & take a 5-question adaptive quiz drill.
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Topic-Wise Accuracy & Mastery Matrix */}
      <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#2C241D]">
            Topic-Wise Mastery Matrix
          </h2>
          <p className="text-xs text-[#7A7165] mt-0.5">
            Real-time Bayesian knowledge score compared with empirical answer accuracy.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#F0EBE0] text-[#7A7165] uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Curriculum Topic</th>
                <th className="py-3 px-4 font-bold">Subject Domain</th>
                <th className="py-3 px-4 font-bold">Accuracy</th>
                <th className="py-3 px-4 font-bold">BKT Mastery</th>
                <th className="py-3 px-4 font-bold">Status Tier</th>
                <th className="py-3 px-4 font-bold text-right">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE0]">
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#7A7165]">
                    No topic performance data logged yet. Complete the diagnostic assessment to populate.
                  </td>
                </tr>
              ) : (
                performances.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#2C241D]">
                      {p.topicTitle}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6256]">
                      {p.subjectTitle}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2C241D]">
                      {p.accuracyPercentage}%
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-[#EBE5D8] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.masteryScore >= 75
                                ? 'bg-[#55634E]'
                                : p.masteryScore >= 50
                                ? 'bg-[#819279]'
                                : 'bg-[#C66B3D]'
                            }`}
                            style={{ width: `${p.masteryScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-[#2C241D] font-bold">{p.masteryScore}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        p.status === 'mastered'
                          ? 'bg-[#E3EBE0] text-[#3A4D33]'
                          : p.status === 'proficient'
                          ? 'bg-[#EAE4D6] text-[#4E4436]'
                          : p.status === 'needs_revision'
                          ? 'bg-[#FAECE6] text-[#934720]'
                          : 'bg-[#F2EEE6] text-[#6E6354]'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#7A7165]">
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
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE0]">
            <h2 className="text-base font-bold text-[#2C241D]">
              Quiz & Assessment Analytics History
            </h2>
            <span className="text-xs text-[#7A7165]">{attempts.length} logged</span>
          </div>

          <div className="space-y-3">
            {attempts.length === 0 ? (
              <p className="text-xs text-[#7A7165] py-4 text-center">
                No assessments taken yet.
              </p>
            ) : (
              attempts.map((att) => (
                <div
                  key={att.id}
                  onClick={() => setSelectedAttempt(att)}
                  className="p-4 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] hover:border-[#55634E] transition-all cursor-pointer flex items-center justify-between text-xs group"
                >
                  <div>
                    <span className="font-bold text-[#2C241D] block capitalize group-hover:text-[#55634E]">
                      {att.assessmentType.replace('_', ' ')}
                    </span>
                    <span className="text-[#7A7165]">
                      {new Date(att.createdAt).toLocaleDateString()} · {Math.round(att.durationSeconds / 60)} mins · Click for Analytics
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#2C241D] block text-sm">
                        {att.scorePercentage}%
                      </span>
                      <span className="text-[11px] text-[#7A7165]">
                        {att.correctCount}/{att.totalQuestions} correct
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-[#55634E] bg-[#E9E4D6] px-2.5 py-1 rounded-full">
                      {att.calculatedLevel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Learning Activity Log */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-7 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#2C241D]">
            Activity History & Milestones
          </h2>

          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-xs text-[#7A7165] py-4 text-center">
                No recent activity logged.
              </p>
            ) : (
              history.slice(0, 6).map((item) => (
                <div key={item.id} className="p-3.5 rounded-2xl border border-[#E8E2D5] bg-white flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-xl bg-[#EBE5D8] text-[#55634E] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#2C241D] truncate">
                      {item.activityTitle}
                    </div>
                    <div className="text-[11px] text-[#7A7165] flex items-center gap-2 mt-0.5">
                      <span className="font-medium text-[#55634E]">+{item.pointsEarned} mastery pts</span>
                      <span aria-hidden="true" className="text-[#D5CFBF]">·</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Attempt Analytics Detail Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E8E2D5] max-w-lg w-full p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EBE5D8] text-[#55634E] flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2C241D] text-base capitalize">
                    {selectedAttempt.assessmentType.replace('_', ' ')} Analytics
                  </h3>
                  <span className="text-[11px] text-[#7A7165]">
                    {new Date(selectedAttempt.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-1 text-[#7A7165] hover:text-[#2C241D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D5]">
                <span className="text-[10px] text-[#7A7165] block uppercase font-bold">Accuracy</span>
                <span className="text-xl font-bold font-mono text-[#2C241D]">{selectedAttempt.scorePercentage}%</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D5]">
                <span className="text-[10px] text-[#7A7165] block uppercase font-bold">Questions</span>
                <span className="text-xl font-bold font-mono text-[#2C241D]">
                  {selectedAttempt.correctCount} / {selectedAttempt.totalQuestions}
                </span>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D5]">
                <span className="text-[10px] text-[#7A7165] block uppercase font-bold">Level</span>
                <span className="text-xl font-bold font-mono text-[#55634E]">{selectedAttempt.calculatedLevel}</span>
              </div>
            </div>

            <div className="p-4 bg-[#F6F3EC] rounded-2xl text-xs text-[#554A3B] space-y-1">
              <span className="font-bold text-[#2C241D] block">Diagnostic Summary:</span>
              <p>
                Duration: {Math.round(selectedAttempt.durationSeconds / 60)} minutes (~{Math.round(selectedAttempt.durationSeconds / Math.max(1, selectedAttempt.totalQuestions))}s per question).
                This session successfully refreshed your Bayesian probability indices for all relevant topics.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-6 py-2 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
