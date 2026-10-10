import React, { useState, useEffect } from 'react';
import {
  HelpCircle, ArrowRight, ArrowLeft, CheckCircle2,
  XCircle, Clock, Award, AlertCircle, RefreshCw,
  Sparkles, TrendingUp, AlertTriangle, BookOpen,
  Calendar, Check, ChevronRight, Play
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { Question, Subject } from '../types/index.ts';

interface AssessmentViewProps {
  onComplete: () => void;
  assessmentType?: string;
  topicId?: string;
  subjectId?: string;
  onNavigate?: (view: string, params?: any) => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  onComplete,
  assessmentType = 'initial_diagnostic',
  topicId,
  subjectId: initialSubjectId,
  onNavigate
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || 'all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [scheduledTopicId, setScheduledTopicId] = useState<string | null>(null);

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        const list = await api.getSubjects();
        setSubjects(list);
      } catch (err) {
        console.warn('Failed to load subjects for assessment:', err);
      }
    }
    loadSubjects();
  }, []);

  // Load assessment questions
  const loadQuestions = async (subId: string) => {
    setLoading(true);
    try {
      const targetSub = subId === 'all' ? undefined : subId;
      const list = await api.getAssessmentQuestions(targetSub, assessmentType === 'initial_diagnostic');
      setQuestions(list);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowHint(false);
      setTimerSeconds(0);
      setResult(null);
    } catch (err) {
      console.error('Failed to load assessment questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(selectedSubjectId);
  }, [selectedSubjectId, assessmentType]);

  // Timer
  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId: string, optIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optIndex
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payloadAnswers = questions.map(q => ({
        questionId: q.id,
        selectedOptionIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
        timeSpentSeconds: Math.round(timerSeconds / Math.max(1, questions.length))
      }));

      const res = await api.submitAssessment({
        assessmentType,
        subjectId: selectedSubjectId === 'all' ? undefined : selectedSubjectId,
        topicId,
        durationSeconds: timerSeconds,
        answers: payloadAnswers
      });

      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Failed to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleRevision = async (topicTitle: string, topicIdToSchedule: string) => {
    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const nextDay = days[new Date().getDay() % 7];
      await api.addTimetableSlot({
        topicTitle: `Revision Drill: ${topicTitle}`,
        dayOfWeek: nextDay,
        durationMinutes: 45,
        timeSlot: '16:00 - 16:45',
        activityType: 'revision',
        topicId: topicIdToSchedule
      });
      setScheduledTopicId(topicIdToSchedule);
      setTimeout(() => setScheduledTopicId(null), 3000);
    } catch (err) {
      console.warn('Slot saved locally');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#55634E] animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-[#2C241D]">Calibrating Diagnostic Assessment...</h2>
        <p className="text-xs text-[#7A7165]">Preparing multi-difficulty questions across your study subjects.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-700 mx-auto" />
        <h2 className="text-xl font-bold text-[#2C241D]">No Questions Available</h2>
        <p className="text-sm text-[#7A7165]">Could not retrieve questions for this subject selection.</p>
        <button
          onClick={onComplete}
          className="px-6 py-2.5 text-xs font-bold text-white bg-[#55634E] rounded-full cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Diagnostic & Quiz Results Analytics Screen
  if (result) {
    const analytics = result.quizAnalytics;
    const strengths = result.strengths || [];
    const weaknesses = result.weaknesses || [];
    const actionIdeas = result.weakTopicActionIdeas || analytics?.actionIdeas || [];

    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-300">
        {/* Main Score Card */}
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#EBE5D8] text-[#554A3B] flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 stroke-[2]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55634E] uppercase tracking-wider bg-[#EBE5D8] px-3.5 py-1.5 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diagnostic & Quiz Analytics Completed</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#2C241D] tracking-tight">
              Knowledge Calibration & Analysis
            </h1>
            <p className="text-xs text-[#7A7165] mt-1 max-w-md mx-auto">
              Your answers have been calibrated through the Bayesian Knowledge Tracing engine.
            </p>
          </div>

          {/* KPI Analytics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5]">
              <div className="text-xs text-[#7A7165] font-semibold">Overall Accuracy</div>
              <div className="text-2xl font-extrabold text-[#2C241D] font-mono tabular-nums mt-1">
                {result.scorePercentage}%
              </div>
              <div className="text-[10px] text-[#8A8174] mt-0.5">
                {result.correctCount} of {result.totalQuestions} correct
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5]">
              <div className="text-xs text-[#7A7165] font-semibold">Knowledge Level</div>
              <div className="text-2xl font-extrabold text-[#55634E] font-mono mt-1">
                {result.calculatedLevel}
              </div>
              <div className="text-[10px] text-[#8A8174] mt-0.5">
                Bayesian tier baseline
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5]">
              <div className="text-xs text-[#7A7165] font-semibold">Time Invested</div>
              <div className="text-2xl font-extrabold text-[#2C241D] font-mono tabular-nums mt-1">
                {formatTime(timerSeconds)}
              </div>
              <div className="text-[10px] text-[#8A8174] mt-0.5">
                ~{Math.round(timerSeconds / Math.max(1, result.totalQuestions))}s per question
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5]">
              <div className="text-xs text-[#7A7165] font-semibold">Mastery Points</div>
              <div className="text-2xl font-extrabold text-[#55634E] font-mono tabular-nums mt-1">
                +50 PTS
              </div>
              <div className="text-[10px] text-[#8A8174] mt-0.5">
                Added to learning streak
              </div>
            </div>
          </div>

          {/* Difficulty Breakdown if available */}
          {analytics?.difficultyBreakdown && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] max-w-xl mx-auto flex items-center justify-around text-xs">
              <div>
                <span className="text-[#7A7165] block font-medium">Easy Questions</span>
                <span className="font-bold text-[#2C241D]">
                  {analytics.difficultyBreakdown.easy?.correct || 0} / {analytics.difficultyBreakdown.easy?.total || 0}
                </span>
              </div>
              <div className="h-6 w-px bg-[#E5E0D5]" />
              <div>
                <span className="text-[#7A7165] block font-medium">Medium Questions</span>
                <span className="font-bold text-[#2C241D]">
                  {analytics.difficultyBreakdown.medium?.correct || 0} / {analytics.difficultyBreakdown.medium?.total || 0}
                </span>
              </div>
              <div className="h-6 w-px bg-[#E5E0D5]" />
              <div>
                <span className="text-[#7A7165] block font-medium">Hard Questions</span>
                <span className="font-bold text-[#2C241D]">
                  {analytics.difficultyBreakdown.hard?.correct || 0} / {analytics.difficultyBreakdown.hard?.total || 0}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onComplete}
              className="px-8 py-3 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => loadQuestions(selectedSubjectId)}
              className="px-6 py-3 text-xs font-bold text-[#382B21] bg-[#F5F2EA] hover:bg-[#EBE5D8] rounded-full transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake Assessment</span>
            </button>
          </div>
        </div>

        {/* Strengths & Weaknesses Assessment Findings */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 1. Strengths Identified */}
          <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE0]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#E3EBE0] text-[#3A4D33] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#2C241D] text-sm">
                  Your Strengths Identified
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#55634E] bg-[#E9E4D6] px-2.5 py-0.5 rounded-full">
                {strengths.length} Confirmed
              </span>
            </div>

            <p className="text-xs text-[#7A7165]">
              Topics where your answers demonstrated solid conceptual grasp and fast retrieval accuracy:
            </p>

            <div className="space-y-2.5">
              {strengths.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] text-xs text-[#7A7165] text-center">
                  Complete more drills to confirm advanced strengths!
                </div>
              ) : (
                strengths.map((s: any) => (
                  <div key={s.topicId} className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#2C241D]">{s.topicTitle}</div>
                      <div className="text-[10px] text-[#55634E] font-medium mt-0.5">
                        High accuracy · {s.accuracyPercentage}% correct
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#3A4D33] bg-[#E3EBE0] px-2.5 py-1 rounded-xl">
                      <TrendingUp className="w-3 h-3" />
                      <span>{s.masteryScore}% BKT</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. Weaknesses Identified */}
          <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE0]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FAECE6] text-[#934720] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#2C241D] text-sm">
                  Your Weaknesses Identified
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#934720] bg-[#FAECE6] px-2.5 py-0.5 rounded-full">
                {weaknesses.length} Vulnerabilities
              </span>
            </div>

            <p className="text-xs text-[#7A7165]">
              Concepts where gaps were detected. These require deliberate spaced revision:
            </p>

            <div className="space-y-2.5">
              {weaknesses.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#E3EBE0] text-xs text-[#3A4D33] font-bold text-center">
                  Outstanding! Zero critical weakness gaps found in this session.
                </div>
              ) : (
                weaknesses.map((w: any) => (
                  <div key={w.topicId} className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#F4DCD1] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#2C241D]">{w.topicTitle}</div>
                      <div className="text-[10px] text-[#934720] font-medium mt-0.5">
                        Retention gap · {w.accuracyPercentage}% accuracy
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#934720] bg-[#FAECE6] px-2 py-1 rounded-lg">
                      Needs Revision
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Suggest Ideas to Strengthen Topics User is Weak In */}
        {actionIdeas.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B4513] bg-[#FDF2E9] px-3 py-1 rounded-full mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pedagogical Action Plan</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#2C241D]">
                Action Ideas to Strengthen Your Weak Topics
              </h2>
              <p className="text-xs text-[#7A7165] mt-1">
                Personalized study interventions to turn these gaps into permanent strengths.
              </p>
            </div>

            <div className="space-y-4">
              {actionIdeas.map((plan: any) => (
                <div
                  key={plan.topicId}
                  className="p-5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#2C241D]">{plan.topicTitle}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                          {plan.urgencyLevel} Priority
                        </span>
                      </div>
                      <p className="text-xs text-[#7A7165] mt-0.5">{plan.shortReason}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                    {/* Action 1: AI Study Notes */}
                    <button
                      onClick={() => onNavigate ? onNavigate('notes', { topicTitle: plan.topicTitle }) : onComplete()}
                      className="p-3 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#55634E] text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EBE5D8] text-[#55634E] flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#2C241D] truncate group-hover:text-[#55634E]">
                            Generate AI Notes
                          </div>
                          <div className="text-[10px] text-[#7A7165]">EN, Hindi, Gujarati</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5BDAF] group-hover:text-[#2C241D]" />
                    </button>

                    {/* Action 2: 5-Question Focused Drill */}
                    <button
                      onClick={() => onNavigate ? onNavigate('practice', { topicId: plan.topicId }) : onComplete()}
                      className="p-3 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#55634E] text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EBE5D8] text-[#382B21] flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#2C241D] truncate group-hover:text-[#55634E]">
                            5-Question Drill
                          </div>
                          <div className="text-[10px] text-[#7A7165]">Adaptive practice</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5BDAF] group-hover:text-[#2C241D]" />
                    </button>

                    {/* Action 3: Add to Timetable */}
                    <button
                      onClick={() => handleScheduleRevision(plan.topicTitle, plan.topicId)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                        scheduledTopicId === plan.topicId
                          ? 'bg-[#E3EBE0] border-[#55634E] text-[#3A4D33]'
                          : 'bg-white border-[#E8E2D5] hover:border-[#55634E]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EBE5D8] text-[#554A3B] flex items-center justify-center shrink-0">
                          {scheduledTopicId === plan.topicId ? (
                            <Check className="w-4 h-4 text-[#55634E]" />
                          ) : (
                            <Calendar className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#2C241D] truncate">
                            {scheduledTopicId === plan.topicId ? 'Scheduled in Timetable!' : 'Add 45m Revision Slot'}
                          </div>
                          <div className="text-[10px] text-[#7A7165]">Next available day</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5BDAF]" />
                    </button>

                    {/* Action 4: Ask AI Tutor */}
                    <button
                      onClick={() => onNavigate ? onNavigate('tutor', { topicId: plan.topicId }) : onComplete()}
                      className="p-3 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#55634E] text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EBE5D8] text-[#55634E] flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#2C241D] truncate group-hover:text-[#55634E]">
                            Ask AI Tutor
                          </div>
                          <div className="text-[10px] text-[#7A7165]">ELI5 & step-by-step</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5BDAF] group-hover:text-[#2C241D]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Solution Review & Explanations */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#2C241D]">
            Detailed Question Review & Explanations
          </h2>

          <div className="space-y-4">
            {result.evaluatedAnswers?.map((ans: any, idx: number) => {
              const q = questions.find(item => item.id === ans.questionId);
              if (!q) return null;
              return (
                <div
                  key={ans.questionId}
                  className={`p-6 rounded-3xl border bg-white shadow-xs ${
                    ans.isCorrect ? 'border-[#87967F]/40' : 'border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#7A7165] font-mono">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs text-[#C5BDAF]">·</span>
                      <span className="text-xs font-bold capitalize text-[#6B6256]">
                        {q.difficulty} Difficulty
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {ans.isCorrect ? (
                        <span className="text-[#4D5A46] flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-[#55634E]" />
                          Correct
                        </span>
                      ) : (
                        <span className="text-amber-800 flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-amber-700" />
                          Review Recommended
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-bold text-[#2C241D] mb-3">
                    {q.questionText}
                  </p>

                  {q.codeSnippet && (
                    <pre className="p-3.5 bg-[#2C241D] text-[#E0D8CB] rounded-2xl text-xs font-mono mb-3 overflow-x-auto">
                      {q.codeSnippet}
                    </pre>
                  )}

                  <div className="grid sm:grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-3 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5]">
                      <span className="text-[#7A7165] block mb-0.5">Your Selected Option:</span>
                      <span className="font-bold text-[#2C241D]">
                        {ans.selectedOptionIndex >= 0 ? q.options[ans.selectedOptionIndex] : 'Skipped'}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#EBE5D8]/50 border border-[#D5CFBE]">
                      <span className="text-[#55634E] font-bold block mb-0.5">Correct Option:</span>
                      <span className="font-bold text-[#2C241D]">
                        {q.options[ans.correctOptionIndex]}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF8F4] text-xs text-[#6B6256] border border-[#E8E2D5]">
                    <span className="font-bold text-[#2C241D] block mb-1">Concept Explanation:</span>
                    {ans.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active Assessment Question
  const currentQ = questions[currentIndex];
  const selectedOpt = selectedAnswers[currentQ.id];
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Subject Filter Selector Bar */}
      <div className="bg-white rounded-3xl border border-[#E8E2D5] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B6256]">Assessment Domain:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E] cursor-pointer"
          >
            <option value="all">All Curriculum Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-[#7A7165] font-medium">
          Calibrating knowledge across {questions.length} questions
        </div>
      </div>

      {/* Upper Meta Bar */}
      <div className="flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-[#7A7165]">
          <span className="font-bold text-[#2C241D]">Question {currentIndex + 1} of {questions.length}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize font-semibold">{currentQ.difficulty} Tier</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[#2C241D] font-bold bg-[#EBE5D8] px-3 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-[#554A3B]" />
          <span>{formatTime(timerSeconds)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[#E8E2D5] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#55634E] transition-all duration-300 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#2C241D] leading-snug">
            {currentQ.questionText}
          </h2>
        </div>

        {currentQ.codeSnippet && (
          <div className="rounded-2xl overflow-hidden border border-[#4A3C30] bg-[#2C241D] p-4">
            <pre className="text-xs font-mono text-[#D8E4D0] overflow-x-auto">
              <code>{currentQ.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((optionText, optIdx) => {
            const isSelected = selectedOpt === optIdx;
            const letter = String.fromCharCode(65 + optIdx);
            return (
              <div
                key={optIdx}
                onClick={() => handleSelectOption(currentQ.id, optIdx)}
                className={`p-4 rounded-2xl border text-sm font-medium transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'border-[#55634E] bg-[#EBE5D8]/60 text-[#2C241D] ring-1 ring-[#55634E]'
                    : 'border-[#E8E2D5] hover:border-[#D5CFBE] hover:bg-[#FAF8F4] text-[#2C241D]'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                  isSelected
                    ? 'bg-[#55634E] border-[#55634E] text-white'
                    : 'bg-[#F6F3EC] border-[#E8E2D5] text-[#7A7165]'
                }`}>
                  {letter}
                </div>
                <span className="flex-1 leading-relaxed font-semibold">{optionText}</span>
              </div>
            );
          })}
        </div>

        {/* Hint Section */}
        {currentQ.hint && (
          <div className="pt-2">
            {!showHint ? (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="text-xs text-[#55634E] hover:text-[#382B21] font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Show Pedagogical Hint</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5] text-xs text-[#6B6256] leading-relaxed">
                <span className="font-bold text-[#2C241D] block mb-0.5">Hint:</span>
                {currentQ.hint}
              </div>
            )}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-[#F0EBE0]">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              setCurrentIndex(currentIndex - 1);
              setShowHint(false);
            }}
            className="px-4 py-2 text-xs font-bold text-[#6B6256] hover:text-[#2C241D] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                setCurrentIndex(currentIndex + 1);
                setShowHint(false);
              }}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#382B21] hover:bg-[#2C221A] rounded-full shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Evaluating...' : 'Submit Diagnostic'}</span>
              <Award className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
