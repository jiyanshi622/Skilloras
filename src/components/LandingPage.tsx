import React from 'react';
import {
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck,
  Cpu, Compass, Activity, Play, BookOpen, Layers
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onDemo }) => {
  return (
    <div className="space-y-24 py-8 pb-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Adaptive Educational Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] text-balance">
              Master complex subjects with an AI tutor that adapts to your mind.
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              Skillora pinpoints your exact knowledge frontiers through diagnostic assessments, models concept mastery with Bayesian Knowledge Tracing, and builds a customized daily study timetable that evolves as you learn.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStart}
                className="px-6 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>Take Diagnostic Assessment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onDemo}
                className="px-6 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                <span>Try Interactive Demo</span>
              </button>
            </div>

            {/* Quiet unboxed metadata proof markers */}
            <div className="pt-6 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 border-t border-slate-200">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Deterministic Scoring Algorithm
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Ollama & Gemini Dual Engine
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                Offline-First Privacy Architecture
              </span>
            </div>
          </div>

          {/* Hero Visual Asset */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900 group">
              <img
                src="/src/assets/images/hero_learning_assistant_1791512279305.jpg"
                alt="Skillora Adaptive Learning Interface with Neural Knowledge Graph"
                referrerPolicy="no-referrer"
                className="w-full h-[420px] object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold mb-1">
                  Active Knowledge Graph
                </span>
                <p className="text-sm font-medium text-white/90">
                  Continuous Bayesian tracking maps confidence across computer science, calculus, and neural networks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Workflow Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
            Closed-Loop Learning Cycle
          </span>
          <h2 className="text-3xl font-bold text-slate-900">
            How Skillora personalizes every study minute
          </h2>
          <p className="text-slate-600 text-base">
            Unlike static course platforms, Skillora follows a continuous adaptive feedback loop that diagnoses, schedules, teaches, drills, and recalibrates.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Diagnostic Assessment
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Solve multi-tier questions across easy, medium, and hard difficulty. The deterministic engine calculates baseline knowledge levels without relying on hallucinated scores.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Outputs: Novice · Competent · Proficient · Master
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Bayesian Knowledge Tracing
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Probability modeling continuously calculates your retention curve for each topic. Weak areas are flagged for urgent revision before forgetting occurs.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              P(Learned) updated dynamically after every attempt
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Adaptive Timetable & Drills
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Receive a daily study schedule calibrated to your exact daily study hours. Read bite-sized explanations, ask the AI tutor in ELI5 or step-by-step mode, and test your memory.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Personalized schedules · Hints · Step-by-step solutions
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Preview Section */}
      <section id="curriculum" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-2xl bg-slate-900 text-white relative overflow-hidden">
          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                Rigorous Foundation Curriculum
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Engineered for serious STEM and software mastery
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Skillora features comprehensive curricula with verified questions, explanations, formulas, and runnable code examples across essential fields.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-sm font-semibold text-white mb-1">Data Structures & Algorithms</div>
                  <div className="text-xs text-slate-400">Asymptotic analysis, balanced BSTs, DP memoization</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-sm font-semibold text-white mb-1">Machine Learning Foundations</div>
                  <div className="text-xs text-slate-400">Cost functions, gradient descent, backpropagation</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-sm font-semibold text-white mb-1">Calculus & Linear Algebra</div>
                  <div className="text-xs text-slate-400">Orthogonal projections, matrix decompositions, PCA</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-sm font-semibold text-white mb-1">Web Systems & DB Indexing</div>
                  <div className="text-xs text-slate-400">B+Trees, idempotency, caching, relational constraints</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl max-w-sm">
                <img
                  src="/src/assets/images/adaptive_curriculum_thumb_1791512304897.jpg"
                  alt="Adaptive Milestones Overview"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offline First & Privacy Callout */}
      <section id="offline-first" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xs">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Privacy & Offline Autonomy</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Run locally with Ollama or stay 100% offline
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Skillora respects your study data. You can run on-device inference using local models (Llama 3, Mistral, Phi-3) via Ollama, or switch to the built-in deterministic pedagogical engine to study seamlessly without any internet connection.
              </p>
            </div>

            <div className="md:col-span-4 flex flex-col gap-3">
              <button
                onClick={onStart}
                className="w-full py-3 px-5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors text-center cursor-pointer"
              >
                Start Learning Now
              </button>
              <button
                onClick={onDemo}
                className="w-full py-3 px-5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-center cursor-pointer"
              >
                Load Pre-Configured Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 pt-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          © 2026 Skillora. AI-Powered Personalized Learning Assistant. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span>FastAPI + MySQL Architecture</span>
          <span aria-hidden="true">·</span>
          <span>Bayesian Knowledge Tracing</span>
          <span aria-hidden="true">·</span>
          <span>Zero External Tracking</span>
        </div>
      </footer>
    </div>
  );
};
