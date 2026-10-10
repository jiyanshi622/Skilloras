import React, { useState } from 'react';
import {
  Compass, Check, ArrowRight, ArrowLeft,
  Sparkles, Brain, Calculator, Globe, Atom
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
  const [subjectList, setSubjectList] = useState(SUBJECTS);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [preferredDailyHours, setPreferredDailyHours] = useState<number>(1.5);
  const [loading, setLoading] = useState(false);

  const handleAddCustomSubject = () => {
    if (!customSubjectInput.trim()) return;
    const customId = `subj_custom_${Date.now()}`;
    const newSub = {
      id: customId,
      title: customSubjectInput.trim(),
      icon: Sparkles,
      category: 'Custom'
    };
    setSubjectList(prev => [...prev, newSub]);
    setSelectedSubjects(prev => [...prev, customId]);
    setCustomSubjectInput('');
  };

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
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#4D5A46] bg-[#E9E4D6] px-3.5 py-1.5 rounded-full">
          <Compass className="w-3.5 h-3.5" />
          <span>Step {step} of 3 · Student Profile Setup</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#2C241D] tracking-tight">
          Tailor Skillora to your ambitions
        </h1>
        <p className="text-[#6B6256] text-sm max-w-lg mx-auto font-medium">
          We configure the pedagogical algorithm and daily schedule around your personal targets.
        </p>

        {/* Stepper indicators */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                num === step
                  ? 'w-10 bg-[#55634E]'
                  : num < step
                  ? 'w-6 bg-[#86957E]'
                  : 'w-6 bg-[#E0D9CB]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C241D] mb-1.5">
                Your Preferred Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 text-sm rounded-2xl border border-[#D5CFBF] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C241D] mb-1.5">
                What are your primary learning goals?
              </label>
              <p className="text-xs text-[#7A7165] mb-3">
                Select at least one goal to guide our recommendation weighting.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {GOALS.map((g) => {
                  const selected = selectedGoals.includes(g.title);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleGoal(g.title)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selected
                          ? 'border-[#55634E] bg-[#EBE5D8]/50 shadow-xs'
                          : 'border-[#E8E2D5] hover:border-[#D5CFBF] bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-bold text-[#2C241D]">{g.title}</div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                          selected ? 'bg-[#55634E] border-[#55634E] text-white' : 'border-[#C8C1B4]'
                        }`}>
                          {selected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-xs text-[#6B6256] mt-1">{g.desc}</p>
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
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C241D] mb-1.5">
                Select Your Study Subjects
              </label>
              <p className="text-xs text-[#7A7165] mb-4">
                Choose the domains you wish to focus on for your curriculum and diagnostic test.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {subjectList.map((sub) => {
                  const Icon = sub.icon || Sparkles;
                  const selected = selectedSubjects.includes(sub.id);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => toggleSubject(sub.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                        selected
                          ? 'border-[#55634E] bg-[#EBE5D8]/50 shadow-xs'
                          : 'border-[#E8E2D5] hover:border-[#D5CFBF] bg-white'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        selected ? 'bg-[#55634E] text-white' : 'bg-[#EBE5D8] text-[#554A3B]'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#2C241D] truncate">{sub.title}</div>
                        <div className="text-xs text-[#7A7165]">{sub.category} Curriculum</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        selected ? 'bg-[#55634E] border-[#55634E] text-white' : 'border-[#C8C1B4]'
                      }`}>
                        {selected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Subject */}
              <div className="pt-3 border-t border-[#F0EBE0] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or enter any custom subject (e.g. Organic Chemistry, Quantum Physics)..."
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  disabled={!customSubjectInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  + Add Subject
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C241D] mb-2">
                Current Experience Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperienceLevel(lvl)}
                    className={`py-3 px-4 rounded-2xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                      experienceLevel === lvl
                        ? 'border-[#55634E] bg-[#55634E] text-white shadow-xs'
                        : 'border-[#E8E2D5] hover:border-[#D5CFBF] text-[#2C241D] bg-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C241D]">
                  Target Daily Study Time
                </label>
                <span className="text-sm font-bold text-[#55634E] font-mono tabular-nums">
                  {preferredDailyHours} hours / day
                </span>
              </div>
              <p className="text-xs text-[#7A7165] mb-4">
                Skillora splits this into dedicated 45-minute focus intervals and revision blocks.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1.0, 1.5, 2.0, 3.0].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setPreferredDailyHours(hours)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      preferredDailyHours === hours
                        ? 'border-[#55634E] bg-[#55634E] text-white'
                        : 'border-[#E8E2D5] hover:border-[#D5CFBF] text-[#2C241D] bg-white'
                    }`}
                  >
                    {hours} hrs
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F3EC] border border-[#E8E2D5] text-xs text-[#6B6256] space-y-1">
              <div className="font-bold text-[#2C241D]">Next Step: Diagnostic Assessment</div>
              <p>
                You will solve targeted multi-difficulty questions to calibrate your Bayesian knowledge baseline.
              </p>
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-8 border-t border-[#F0EBE0] mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-bold text-[#6B6256] hover:text-[#2C241D] flex items-center gap-1 cursor-pointer"
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
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
