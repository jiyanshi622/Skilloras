import React, { useState } from 'react';
import {
  Compass, Check, ArrowRight, ArrowLeft, Clock,
  Sparkles, BookOpen, Brain, Calculator, Globe, Atom
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { User, StudentProfile, ExperienceLevel } from '../types/index.ts';

interface OnboardingViewProps {
  user: User;
  onCompleted: (profile: StudentProfile) => void;
}

const GOALS = [
  { id: 'interviews', title: 'Ace Competitive Tech Interviews', desc: 'Deep dive into LeetCode style DSA and dynamic programming.' },
  { id: 'ml_ai', title: 'Master Machine Learning & AI Foundations', desc: 'Build solid theoretical intuition for gradient descent & backprop.' },
  { id: 'university', title: 'Pass University Exams with Top Honors', desc: 'Master rigorous proofs, calculus theorems, and algorithm analysis.' },
  { id: 'systems', title: 'Design Scalable Full-Stack Web Systems', desc: 'Understand relational indexes, B-Trees, and backend architecture.' },
];

const SUBJECTS = [
  { id: 'subj_cs_dsa', title: 'Data Structures & Algorithms', icon: Brain, category: 'CS' },
  { id: 'subj_ml_ai', title: 'Machine Learning & Neural Networks', icon: Sparkles, category: 'AI' },
  { id: 'subj_math', title: 'Calculus & Linear Algebra', icon: Calculator, category: 'Math' },
  { id: 'subj_web', title: 'Full-Stack Web Architecture', icon: Globe, category: 'Web' },
  { id: 'subj_physics', title: 'Classical & Computational Physics', icon: Atom, category: 'Physics' },
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({ user, onCompleted }) => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(user.fullName || '');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([GOALS[0].title]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['subj_cs_dsa', 'subj_ml_ai']);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [preferredDailyHours, setPreferredDailyHours] = useState<number>(1.5);
  const [loading, setLoading] = useState(false);

  const toggleGoal = (title: string) => {
    if (selectedGoals.includes(title)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter(g => g !== title));
      }
    } else {
      setSelectedGoals([...selectedGoals, title]);
    }
  };

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== id));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await api.submitOnboarding({
        fullName,
        learningGoals: selectedGoals,
        selectedSubjects,
        experienceLevel,
        preferredDailyHours
      });
      onCompleted(res.profile);
    } catch (err: any) {
      alert(err.message || 'Failed to save onboarding details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Stepper Header */}
      <div className="mb-10 text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md">
          <Compass className="w-3.5 h-3.5" />
          <span>Step {step} of 3 · Student Profile Setup</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Tailor Skillora to your ambitions
        </h1>
        <p className="text-slate-600 text-sm max-w-lg mx-auto">
          We configure the pedagogical algorithm and daily schedule around your personal targets.
        </p>

        {/* Stepper indicators */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                num === step
                  ? 'w-10 bg-indigo-600'
                  : num < step
                  ? 'w-6 bg-emerald-500'
                  : 'w-6 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Your Preferred Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                What are your primary learning goals?
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Select at least one goal to guide our recommendation weighting.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {GOALS.map((g) => {
                  const selected = selectedGoals.includes(g.title);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleGoal(g.title)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">{g.title}</div>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                          selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                        }`}>
                          {selected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{g.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Select Your Study Subjects
              </label>
              <p className="text-xs text-slate-500 mb-4">
                Choose the domains you wish to focus on for your curriculum and diagnostic test.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {SUBJECTS.map((sub) => {
                  const Icon = sub.icon;
                  const selected = selectedSubjects.includes(sub.id);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => toggleSubject(sub.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                        selected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{sub.title}</div>
                        <div className="text-xs text-slate-500">{sub.category} Curriculum</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                        selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {selected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Current Experience Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperienceLevel(lvl)}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold capitalize transition-all cursor-pointer ${
                      experienceLevel === lvl
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Target Daily Study Time
                </label>
                <span className="text-sm font-bold text-indigo-600 font-mono tabular-nums">
                  {preferredDailyHours} hours / day
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Skillora splits this into dedicated 45-minute focus intervals and revision blocks.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1.0, 1.5, 2.0, 3.0].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setPreferredDailyHours(hours)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      preferredDailyHours === hours
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {hours} hrs
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-900">Next Step: Initial Diagnostic Assessment</div>
              <p>
                You will solve 10 targeted questions to calibrate your Bayesian knowledge baseline. Don't worry if questions get difficult—the engine adapts as you go!
              </p>
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Initializing...' : 'Start Diagnostic Assessment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
