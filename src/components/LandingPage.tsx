import React from 'react';
import {
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck,
  Cpu, Play, BookOpen
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onDemo }) => {
  return (
    <div className="space-y-20 py-8 pb-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4D5A46] bg-[#E9E4D6] px-3.5 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#55634E]" />
              <span>Adaptive Educational Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#2C241D] tracking-tight leading-[1.14] text-balance">
              Learn with us.<br />
              Grow with confidence.
            </h1>

            <p className="text-base sm:text-lg text-[#6B6256] leading-relaxed max-w-2xl font-medium">
              Skillora pinpoints your exact knowledge frontiers through diagnostic assessments, models concept mastery with Bayesian Knowledge Tracing, and builds a customized daily study timetable that evolves as you learn.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onStart}
                className="px-6 py-3.5 text-sm font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>Take Diagnostic Assessment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onDemo}
                className="px-6 py-3.5 text-sm font-bold text-[#382B21] bg-white border border-[#E5E0D4] hover:bg-[#FAF7F2] rounded-full transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Play className="w-4 h-4 fill-[#382B21]" />
                <span>Try Interactive Demo</span>
              </button>
            </div>

            {/* Proof markers */}
            <div className="pt-6 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#7A7165] border-t border-[#E8E2D5]">
              <span className="flex items-center gap-1.5 text-[#3D352B] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#55634E]" />
                Deterministic Scoring Algorithm
              </span>
              <span aria-hidden="true" className="text-[#D0C9BA]">·</span>
              <span className="flex items-center gap-1.5 text-[#3D352B] font-semibold">
                <Cpu className="w-4 h-4 text-[#55634E]" />
                Ollama & Gemini Dual Engine
              </span>
              <span aria-hidden="true" className="text-[#D0C9BA]">·</span>
              <span className="flex items-center gap-1.5 text-[#3D352B] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#55634E]" />
                Offline-First Privacy Architecture
              </span>
            </div>
          </div>

          {/* Hero Visual Asset */}
          <div className="lg:col-span-5">
            <div className="relative rounded-[28px] overflow-hidden border border-[#E5E0D4] shadow-md bg-[#382B21] group">
              <img
                src="/src/assets/images/hero_learning_assistant_1791512279305.jpg"
                alt="Skillora Adaptive Learning Interface with Neural Knowledge Graph"
                referrerPolicy="no-referrer"
                className="w-full h-[420px] object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#261E17]/85 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="text-xs uppercase tracking-wider text-[#E8DFD0] font-bold mb-1">
                  Active Knowledge Graph
                </span>
                <p className="text-sm font-medium text-white/95">
                  Continuous Bayesian tracking maps confidence across computer science, calculus, and neural networks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Workflow Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold tracking-wider text-[#55634E] uppercase">
            Closed-Loop Learning Cycle
          </span>
          <h2 className="text-3xl font-extrabold text-[#2C241D] tracking-tight">
            How Skillora personalizes every study minute
          </h2>
          <p className="text-[#6B6256] text-sm sm:text-base font-medium">
            Unlike static course platforms, Skillora follows a continuous adaptive feedback loop that diagnoses, schedules, teaches, drills, and recalibrates.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl border border-[#E8E2D5] bg-white shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EBE5D8] flex items-center justify-center text-[#3D352B] font-extrabold text-sm">
              01
            </div>
            <h3 className="text-lg font-bold text-[#2C241D]">
              Diagnostic Assessment
            </h3>
            <p className="text-sm text-[#6B6256] leading-relaxed">
              Solve multi-tier questions across easy, medium, and hard difficulty. The deterministic engine calculates baseline knowledge levels without relying on hallucinated scores.
            </p>
            <div className="pt-2 text-xs text-[#8A8174] font-medium">
              Outputs: Novice · Competent · Proficient · Master
            </div>
          </div>

          <div className="p-7 rounded-3xl border border-[#E8E2D5] bg-white shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EBE5D8] flex items-center justify-center text-[#3D352B] font-extrabold text-sm">
              02
            </div>
            <h3 className="text-lg font-bold text-[#2C241D]">
              Bayesian Knowledge Tracing
            </h3>
            <p className="text-sm text-[#6B6256] leading-relaxed">
              Probability modeling continuously calculates your retention curve for each topic. Weak areas are flagged for urgent revision before forgetting occurs.
            </p>
            <div className="pt-2 text-xs text-[#8A8174] font-medium">
              P(Learned) updated dynamically after every attempt
            </div>
          </div>

          <div className="p-7 rounded-3xl border border-[#E8E2D5] bg-white shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EBE5D8] flex items-center justify-center text-[#3D352B] font-extrabold text-sm">
              03
            </div>
            <h3 className="text-lg font-bold text-[#2C241D]">
              Adaptive Timetable & Drills
            </h3>
            <p className="text-sm text-[#6B6256] leading-relaxed">
              Receive a daily study schedule calibrated to your exact daily study hours. Read bite-sized explanations, ask the AI tutor in ELI5 or step-by-step mode, and test your memory.
            </p>
            <div className="pt-2 text-xs text-[#8A8174] font-medium">
              Personalized schedules · Hints · Step-by-step solutions
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Preview Section */}
      <section id="curriculum" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-[32px] bg-[#382B21] text-white relative overflow-hidden">
          <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs uppercase tracking-wider text-[#DCD4C6] font-bold">
                Rigorous Foundation Curriculum
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Engineered for serious STEM and software mastery
              </h2>
              <p className="text-[#D0C6B5] text-sm leading-relaxed">
                Skillora features comprehensive curricula with verified questions, explanations, formulas, and runnable code examples across essential fields.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-[#4A3C30]/80 border border-[#5E4E40]">
                  <div className="text-sm font-bold text-white mb-1">Data Structures & Algorithms</div>
                  <div className="text-xs text-[#C6BBAA]">Asymptotic analysis, balanced BSTs, DP memoization</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#4A3C30]/80 border border-[#5E4E40]">
                  <div className="text-sm font-bold text-white mb-1">Machine Learning Foundations</div>
                  <div className="text-xs text-[#C6BBAA]">Cost functions, gradient descent, backpropagation</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#4A3C30]/80 border border-[#5E4E40]">
                  <div className="text-sm font-bold text-white mb-1">Calculus & Linear Algebra</div>
                  <div className="text-xs text-[#C6BBAA]">Orthogonal projections, matrix decompositions, PCA</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#4A3C30]/80 border border-[#5E4E40]">
                  <div className="text-sm font-bold text-white mb-1">Web Systems & DB Indexing</div>
                  <div className="text-xs text-[#C6BBAA]">B+Trees, idempotency, caching, relational constraints</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="rounded-2xl overflow-hidden border border-[#5E4E40] shadow-2xl max-w-sm">
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
        <div className="rounded-[32px] border border-[#E8E2D5] bg-white p-8 sm:p-10 shadow-xs">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4D5A46] bg-[#E9E4D6] px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-[#55634E]" />
                <span>Privacy & Offline Autonomy</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C241D] tracking-tight">
                Run locally with Ollama or stay 100% offline
              </h2>
              <p className="text-[#6B6256] text-sm sm:text-base leading-relaxed">
                Skillora respects your study data. You can run on-device inference using local models (Llama 3, Mistral, Phi-3) via Ollama, or switch to the built-in deterministic pedagogical engine to study seamlessly without any internet connection.
              </p>
            </div>

            <div className="md:col-span-4 flex flex-col gap-3">
              <button
                onClick={onStart}
                className="w-full py-3.5 px-5 text-sm font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full transition-colors text-center cursor-pointer shadow-xs"
              >
                Start Learning Now
              </button>
              <button
                onClick={onDemo}
                className="w-full py-3.5 px-5 text-sm font-bold text-[#382B21] bg-[#FAF7F2] hover:bg-[#F0ECE1] border border-[#E5E0D4] rounded-full transition-colors text-center cursor-pointer"
              >
                Load Pre-Configured Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#E8E2D5] pt-8 text-xs text-[#7A7165] flex flex-col sm:flex-row items-center justify-between gap-4">
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
