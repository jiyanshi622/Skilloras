import React, { useState, useEffect } from 'react';
import {
  BrainCircuit, CheckCircle2, ArrowRight,
  HelpCircle, RefreshCw, AlertCircle, Award,
  Sparkles, XCircle, Play, Calendar, BookOpen,
  TrendingUp, RotateCcw
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { Question, Topic } from '../types/index.ts';

interface PracticeQuizViewProps {
  initialTopicId?: string;
  onNavigateToTutor: (topicId: string) => void;
  onNavigateToDashboard: () => void;
  onNavigateToNotes?: (topicTitle: string) => void;
}

interface AttemptRecord {
  question: Question;
  selectedOption: number;
  isCorrect: boolean;
}

export const PracticeQuizView: React.FC<PracticeQuizViewProps> = ({
  initialTopicId,
  onNavigateToTutor,
  onNavigateToDashboard,
  onNavigateToNotes,
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || '');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);

  // Session Quiz Analytics state
  const [sessionAttempts, setSessionAttempts] = useState<AttemptRecord[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

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
    setIsQuizCompleted(false);
    setSessionAttempts([]);
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
    const isCorrect = selectedOption === currentQ.correctOptionIndex;

    setSessionAttempts(prev => [
      ...prev,
      {
        question: currentQ,
        selectedOption,
        isCorrect
      }
    ]);

    try {
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
      setIsQuizCompleted(true);
    }
  };

  const currentTopic = topics.find(t => t.id === selectedTopicId);
  const currentQ = questions[currentIndex];

  // If session quiz completed, render Quiz Result Analytics
  if (isQuizCompleted && sessionAttempts.length > 0) {
    const total = sessionAttempts.length;
    const correctCount = sessionAttempts.filter(a => a.isCorrect).length;
    const scorePct = Math.round((correctCount / total) * 100);
    const missedQuestions = sessionAttempts.filter(a => !a.isCorrect);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
        {/* Main Result Card */}
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#EBE5D8] text-[#554A3B] flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 stroke-[2]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#55634E] uppercase tracking-wider bg-[#EBE5D8] px-3.5 py-1.5 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quiz Analytics & Session Report</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#2C241D] tracking-tight">
              {currentTopic?.title || 'Practice Session'} Completed!
            </h1>
            <p className="text-xs text-[#7A7165] mt-1 max-w-md mx-auto">
              Your responses have updated your Bayesian Knowledge Tracing curve for this topic.
            </p>
          </div>

          {/* KPI Analytics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5]">
              <div className="text-xs text-[#7A7165] font-semibold">Session Accuracy</div>
              <div className="text-2xl font-extrabold text-[#2C241D] font-mono tabular-nums mt-1">
                {scorePct}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5]">
              <div className="text-xs text-[#7A7165] font-semibold">Correct Answers</div>
              <div className="text-2xl font-extrabold text-[#2C241D] font-mono tabular-nums mt-1">
                {correctCount} / {total}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5]">
              <div className="text-xs text-[#7A7165] font-semibold">Topic Status</div>
              <div className="text-xl font-extrabold text-[#55634E] mt-1">
                {scorePct >= 75 ? 'Mastered' : scorePct >= 50 ? 'Developing' : 'Needs Work'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5]">
              <div className="text-xs text-[#7A7165] font-semibold">Mastery Points</div>
              <div className="text-2xl font-extrabold text-[#55634E] font-mono tabular-nums mt-1">
                +{correctCount * 10} PTS
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fetchQuestions(selectedTopicId, difficultyFilter)}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice More Questions</span>
            </button>
            <button
              onClick={onNavigateToDashboard}
              className="px-6 py-2.5 text-xs font-bold text-[#382B21] bg-[#F5F2EA] hover:bg-[#EBE5D8] rounded-full transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Action Ideas to Strengthen Weak Concepts */}
        {missedQuestions.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F0EBE0]">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-[#2C241D] text-sm">
                  Ideas to Strengthen Concepts You Missed ({missedQuestions.length} questions)
                </h3>
                <p className="text-xs text-[#7A7165]">
                  Address these knowledge gaps before moving to advanced topics:
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              <button
                onClick={() => onNavigateToNotes ? onNavigateToNotes(currentTopic?.title || 'Concept') : onNavigateToTutor(selectedTopicId)}
                className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] hover:border-[#55634E] text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#EBE5D8] text-[#55634E] flex items-center justify-center mb-2">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#2C241D] group-hover:text-[#55634E]">
                  Generate AI Study Notes
                </div>
                <p className="text-[11px] text-[#7A7165] mt-1">
                  Read simplified formulas & examples in EN, Hindi or Gujarati.
                </p>
              </button>

              <button
                onClick={() => onNavigateToTutor(selectedTopicId)}
                className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] hover:border-[#55634E] text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#EBE5D8] text-[#55634E] flex items-center justify-center mb-2">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#2C241D] group-hover:text-[#55634E]">
                  Ask AI Tutor (ELI5)
                </div>
                <p className="text-[11px] text-[#7A7165] mt-1">
                  Get everyday analogies and step-by-step traces.
                </p>
              </button>

              <button
                onClick={async () => {
                  try {
                    await api.addTimetableSlot({
                      topicTitle: `Revision: ${currentTopic?.title || 'Topic'}`,
                      dayOfWeek: 'Wednesday',
                      durationMinutes: 45,
                      timeSlot: '15:00 - 15:45',
                      activityType: 'revision',
                      topicId: selectedTopicId
                    });
                    alert('45-minute revision slot added to timetable!');
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] hover:border-[#55634E] text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#EBE5D8] text-[#554A3B] flex items-center justify-center mb-2">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#2C241D] group-hover:text-[#55634E]">
                  Schedule Revision Slot
                </div>
                <p className="text-[11px] text-[#7A7165] mt-1">
                  Add 45m deliberate practice block to your timetable.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Question-by-Question Review */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#2C241D]">
            Session Question Review
          </h2>

          <div className="space-y-3">
            {sessionAttempts.map((item, idx) => (
              <div
                key={item.question.id}
                className={`p-5 rounded-2xl border bg-white shadow-xs ${
                  item.isCorrect ? 'border-[#87967F]/40' : 'border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0EBE0] mb-3">
                  <span className="font-bold text-[#7A7165]">Question {idx + 1}</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {item.isCorrect ? (
                      <span className="text-[#4D5A46] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-[#55634E]" />
                        Correct
                      </span>
                    ) : (
                      <span className="text-amber-800 flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-amber-700" />
                        Incorrect
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-bold text-[#2C241D] mb-3">
                  {item.question.questionText}
                </p>

                <div className="grid sm:grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2.5 rounded-xl bg-[#F6F3EC]">
                    <span className="text-[#7A7165] block text-[10px]">Your Answer:</span>
                    <span className="font-semibold text-[#2C241D]">
                      {item.question.options[item.selectedOption]}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#EBE5D8]/50">
                    <span className="text-[#55634E] block text-[10px] font-bold">Correct Answer:</span>
                    <span className="font-semibold text-[#2C241D]">
                      {item.question.options[item.question.correctOptionIndex]}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#6B6256] bg-[#FAF8F4] p-3 rounded-xl border border-[#E8E2D5]">
                  <strong className="text-[#2C241D] block mb-0.5">Explanation:</strong>
                  {item.question.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Upper Control Bar */}
      <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#4D5A46] bg-[#E9E4D6] px-3.5 py-1.5 rounded-full w-fit mb-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-[#55634E]" />
              <span>Deliberate Practice Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#2C241D] tracking-tight">
              Adaptive Practice & Quizzes
            </h1>
          </div>

          {/* Topic Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[#6B6256] shrink-0 uppercase tracking-wider">
              Topic:
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold rounded-2xl border border-[#D5CFBF] bg-[#FAF8F5] text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E] max-w-[260px] truncate cursor-pointer"
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
        <div className="flex items-center justify-between border-t border-[#F0EBE0] pt-3.5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8A8174]">Difficulty:</span>
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3.5 py-1 text-xs font-bold rounded-full capitalize transition-colors cursor-pointer ${
                  difficultyFilter === diff
                    ? 'bg-[#55634E] text-white shadow-2xs'
                    : 'bg-[#F5F2EA] text-[#6B6256] hover:bg-[#EBE5D8]'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-[#7A7165]">
            Focus: <span className="font-bold text-[#2C241D]">{currentTopic?.title}</span>
          </div>
        </div>
      </div>

      {/* Main Question Arena */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-16 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#55634E] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-[#2C241D]">Loading Practice Questions...</h3>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-12 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-700 mx-auto" />
          <h3 className="text-lg font-bold text-[#2C241D]">
            No Questions Found for This Filter
          </h3>
          <p className="text-xs text-[#7A7165] max-w-sm mx-auto font-medium">
            Try switching the difficulty filter to "all" or select a different curriculum topic.
          </p>
          <button
            onClick={() => setDifficultyFilter('all')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#55634E] rounded-full cursor-pointer"
          >
            Show All Difficulties
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs space-y-6">
          {/* Question Metadata Header */}
          <div className="flex items-center justify-between text-xs pb-4 border-b border-[#F0EBE0]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#2C241D]">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span aria-hidden="true" className="text-[#C5BDAF]">·</span>
              <span className="capitalize font-bold text-[#55634E]">
                {currentQ.difficulty} Tier
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToTutor(selectedTopicId)}
                className="text-xs font-bold text-[#55634E] hover:text-[#382B21] cursor-pointer"
              >
                Ask Tutor About This →
              </button>
            </div>
          </div>

          {/* Question Prompt */}
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2C241D] leading-snug">
              {currentQ.questionText}
            </h2>
          </div>

          {/* Code snippet if present */}
          {currentQ.codeSnippet && (
            <div className="rounded-2xl overflow-hidden border border-[#4A3C30] bg-[#2C241D] p-4">
              <pre className="text-xs font-mono text-[#D8E4D0] overflow-x-auto">
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
                  className={`p-4 rounded-2xl border text-sm font-medium transition-all flex items-center gap-3.5 ${
                    isAnswerSubmitted
                      ? isSelected
                        ? 'border-[#55634E] bg-[#EBE5D8]/70 text-[#2C241D] ring-1 ring-[#55634E]'
                        : 'border-[#E8E2D5] text-[#6B6256] opacity-80'
                      : isSelected
                      ? 'border-[#55634E] bg-[#EBE5D8]/60 text-[#2C241D] ring-1 ring-[#55634E] cursor-pointer'
                      : 'border-[#E8E2D5] hover:border-[#D5CFBE] hover:bg-[#FAF8F4] text-[#2C241D] cursor-pointer'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                    isSelected
                      ? 'bg-[#55634E] border-[#55634E] text-white'
                      : 'bg-[#F6F3EC] border-[#E8E2D5] text-[#7A7165]'
                  }`}>
                    {letter}
                  </div>
                  <span className="flex-1 leading-relaxed font-semibold">{optText}</span>
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
                  className="text-xs font-bold text-[#55634E] hover:text-[#382B21] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Reveal Conceptual Hint</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5] text-xs text-[#6B6256] leading-relaxed">
                  <span className="font-bold text-[#2C241D] block mb-1">Pedagogical Hint:</span>
                  {currentQ.hint}
                </div>
              )}
            </div>
          )}

          {/* Post-Submission Instant Explanation */}
          {isAnswerSubmitted && (
            <div className="p-5 rounded-2xl bg-[#FAF8F4] border border-[#E8E2D5] space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2C241D]">
                <CheckCircle2 className="w-4 h-4 text-[#55634E]" />
                <span>Concept Breakdown & Solution</span>
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                {currentQ.explanation}
              </p>
              <div className="pt-2 text-[11px] text-[#8A8174] font-medium">
                Bayesian Knowledge Tracing has updated your topic mastery score.
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-[#F0EBE0]">
            <button
              onClick={onNavigateToDashboard}
              className="text-xs font-bold text-[#7A7165] hover:text-[#2C241D] cursor-pointer"
            >
              Exit to Dashboard
            </button>

            {!isAnswerSubmitted ? (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleCheckAnswer}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Submit & Check Solution
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#382B21] hover:bg-[#2C221A] rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Quiz Result Analytics'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
