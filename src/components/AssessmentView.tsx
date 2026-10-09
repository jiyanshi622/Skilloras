import React, { useState, useEffect } from 'react';
import {
  HelpCircle, ArrowRight, ArrowLeft, CheckCircle2,
  XCircle, Clock, Sparkles, Award, BarChart,
  BrainCircuit, AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { Question } from '../types/index.ts';

interface AssessmentViewProps {
  onComplete: () => void;
  assessmentType?: string;
  topicId?: string;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  onComplete,
  assessmentType = 'initial_diagnostic',
  topicId
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      try {
        const list = await api.getAssessmentQuestions(undefined, assessmentType === 'initial_diagnostic');
        setQuestions(list);
      } catch (err) {
        console.error('Failed to load assessment questions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [assessmentType]);

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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Calibrating Diagnostic Assessment...</h2>
        <p className="text-xs text-slate-500">Preparing multi-tier questions across curriculum topics.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">No Questions Available</h2>
        <p className="text-sm text-slate-500">Could not retrieve questions for this assessment session.</p>
        <button
          onClick={onComplete}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Diagnostic Results Screen
  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Diagnostic Complete
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Calibration & Knowledge Level Analyzed
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500">Overall Accuracy</div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {result.scorePercentage}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500">Correct Answers</div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {result.correctCount} / {result.totalQuestions}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500">Knowledge Level</div>
              <div className="text-2xl font-bold text-indigo-600 font-mono mt-1">
                {result.calculatedLevel}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500">Time Taken</div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatTime(timerSeconds)}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onComplete}
              className="px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>Access Your Personalized Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Answer Breakdown */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Detailed Solution Review & Concept Explanations
          </h2>

          <div className="space-y-4">
            {result.evaluatedAnswers?.map((ans: any, idx: number) => {
              const q = questions.find(item => item.id === ans.questionId);
              if (!q) return null;
              return (
                <div
                  key={ans.questionId}
                  className={`p-6 rounded-xl border bg-white shadow-xs ${
                    ans.isCorrect ? 'border-emerald-200' : 'border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-semibold capitalize text-slate-600">
                        {q.difficulty} Difficulty
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {ans.isCorrect ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Correct
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-amber-600" />
                          Review Recommended
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mb-3">
                    {q.questionText}
                  </p>

                  {q.codeSnippet && (
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono mb-3 overflow-x-auto">
                      {q.codeSnippet}
                    </pre>
                  )}

                  <div className="grid sm:grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block mb-0.5">Your Selected Option:</span>
                      <span className="font-semibold text-slate-800">
                        {ans.selectedOptionIndex >= 0 ? q.options[ans.selectedOptionIndex] : 'Skipped'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <span className="text-emerald-700 block mb-0.5">Correct Option:</span>
                      <span className="font-semibold text-emerald-900">
                        {q.options[ans.correctOptionIndex]}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-700 border border-slate-200">
                    <span className="font-semibold text-slate-900 block mb-1">Concept Explanation:</span>
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
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Upper Meta Bar */}
      <div className="flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-900">Question {currentIndex + 1} of {questions.length}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize font-medium">{currentQ.difficulty} Tier</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold bg-slate-100 px-2.5 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatTime(timerSeconds)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {currentQ.questionText}
          </h2>
        </div>

        {currentQ.codeSnippet && (
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
            <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
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
                className={`p-4 rounded-xl border text-sm font-medium transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {letter}
                </div>
                <span className="flex-1 leading-relaxed">{optionText}</span>
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
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Show Pedagogical Hint</span>
              </button>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <span className="font-semibold block mb-0.5">Hint:</span>
                {currentQ.hint}
              </div>
            )}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              setCurrentIndex(currentIndex - 1);
              setShowHint(false);
            }}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
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
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
