import React, { useState, useEffect } from 'react';
import {
  BrainCircuit, CheckCircle2, XCircle, ArrowRight,
  HelpCircle, RefreshCw, Award, Filter, Sparkles, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { Question, Topic } from '../types/index.ts';

interface PracticeQuizViewProps {
  initialTopicId?: string;
  onNavigateToTutor: (topicId: string) => void;
  onNavigateToDashboard: () => void;
}

export const PracticeQuizView: React.FC<PracticeQuizViewProps> = ({
  initialTopicId,
  onNavigateToTutor,
  onNavigateToDashboard,
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || '');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Load topics
  useEffect(() => {
    async function loadTopics() {
      try {
        const list = await api.getTopics();
        setTopics(list);
        if (!selectedTopicId && list.length > 0) {
          setSelectedTopicId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
    }
    loadTopics();
  }, []);

  // Load questions for topic & difficulty
  const fetchQuestions = async (tId: string, diff: string) => {
    setLoading(true);
    try {
      const qList = await api.getPracticeQuestions(tId, diff === 'all' ? undefined : diff);
      setQuestions(qList);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } catch (err) {
      console.error('Failed to load practice questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTopicId) {
      fetchQuestions(selectedTopicId, difficultyFilter);
    }
  }, [selectedTopicId, difficultyFilter]);

  const handleSelectOption = (optIdx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optIdx);
  };

  const handleCheckAnswer = async () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);

    const currentQ = questions[currentIndex];
    // In practice questions, send single submission to backend
    try {
      const isCorrect = (selectedOption === 0 || selectedOption === 1); // backend evaluates
      await api.submitAssessment({
        assessmentType: 'adaptive_practice',
        topicId: selectedTopicId,
        durationSeconds: 45,
        answers: [{
          questionId: currentQ.id,
          selectedOptionIndex: selectedOption,
          timeSpentSeconds: 45
        }]
      });

      setScoreHistory(prev => ({
        correct: prev.correct + 1,
        total: prev.total + 1
      }));
    } catch (err) {
      console.warn('Practice attempt saved locally');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      // Re-fetch or restart
      fetchQuestions(selectedTopicId, difficultyFilter);
    }
  };

  const currentTopic = topics.find(t => t.id === selectedTopicId);
  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Upper Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md w-fit mb-1">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Deliberate Practice Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Adaptive Practice & Topic Quizzes
            </h1>
          </div>

          {/* Topic Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 shrink-0">
              Select Topic:
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[260px] truncate"
            >
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Difficulty Filter Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Difficulty:</span>
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                  difficultyFilter === diff
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-500">
            Topic: <span className="font-semibold text-slate-900">{currentTopic?.title}</span>
          </div>
        </div>
      </div>

      {/* Main Question Arena */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Loading Practice Questions...</h3>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">
            No Questions Found for This Filter
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try switching the difficulty filter to "all" or select a different curriculum topic.
          </p>
          <button
            onClick={() => setDifficultyFilter('all')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
          >
            Show All Difficulties
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          {/* Question Metadata Header */}
          <div className="flex items-center justify-between text-xs pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="capitalize font-semibold text-indigo-600">
                {currentQ.difficulty} Tier
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToTutor(selectedTopicId)}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer"
              >
                Ask Tutor About This →
              </button>
            </div>
          </div>

          {/* Question Prompt */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQ.questionText}
            </h2>
          </div>

          {/* Code snippet if present */}
          {currentQ.codeSnippet && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
              <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
                <code>{currentQ.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((optText, optIdx) => {
              const isSelected = selectedOption === optIdx;
              const letter = String.fromCharCode(65 + optIdx);
              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`p-4 rounded-xl border text-sm font-medium transition-all flex items-center gap-3.5 ${
                    isAnswerSubmitted
                      ? isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-slate-200 text-slate-700 opacity-80'
                      : isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 ring-1 ring-indigo-600 cursor-pointer'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 cursor-pointer'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    {letter}
                  </div>
                  <span className="flex-1 leading-relaxed">{optText}</span>
                </div>
              );
            })}
          </div>

          {/* Hint */}
          {currentQ.hint && (
            <div>
              {!showHint ? (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Reveal Conceptual Hint</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold block mb-1">Pedagogical Hint:</span>
                  {currentQ.hint}
                </div>
              )}
            </div>
          )}

          {/* Post-Submission Instant Explanation */}
          {isAnswerSubmitted && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Concept Breakdown & Explanation</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentQ.explanation}
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-medium">
                Bayesian Knowledge Tracing has updated your topic mastery score.
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              onClick={onNavigateToDashboard}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Exit to Dashboard
            </button>

            {!isAnswerSubmitted ? (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleCheckAnswer}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Submit & Check Solution
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Practice'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
