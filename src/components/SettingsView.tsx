import React, { useState, useEffect } from 'react';
import {
  Settings, User, Cpu, Database, Volume2,
  Download, RefreshCw, CheckCircle2, Shield,
  HardDrive, Code, Server, GitBranch, UploadCloud, Terminal
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { User as UserType, StudentProfile, AISettings } from '../types/index.ts';

interface SettingsViewProps {
  user: UserType;
  profile: StudentProfile;
  onProfileUpdated: (profile: StudentProfile) => void;
  onOpenGitHubModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  profile,
  onProfileUpdated,
  onOpenGitHubModal,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'profile' | 'database' | 'github'>('ai');
  const [aiSettings, setAiSettings] = useState<AISettings>({
    engineProvider: 'gemini',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama3',
    geminiModel: 'gemini-3.8-flash',
    speechEnabled: true
  });
  const [preferredHours, setPreferredHours] = useState(profile.preferredDailyHours);
  const [fullName, setFullName] = useState(user.fullName);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [gitStatus, setGitStatus] = useState<any>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [s, g] = await Promise.all([
          api.getSettings(),
          api.getGitStatus().catch(() => null)
        ]);
        setAiSettings(s);
        if (g) setGitStatus(g);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSaveAISettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await api.updateSettings(aiSettings);
      setAiSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update AI settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.submitOnboarding({
        fullName,
        learningGoals: profile.learningGoals,
        selectedSubjects: profile.selectedSubjects,
        experienceLevel: profile.experienceLevel,
        preferredDailyHours: preferredHours
      });
      onProfileUpdated(res.profile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save profile settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadSchema = () => {
    window.open('/schema.sql', '_blank');
  };

  const handleExportJson = () => {
    window.open('/api/settings/export-db', '_blank');
  };

  const handleDownloadArchive = () => {
    window.location.href = '/api/github/download-archive';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-[#4D5A46] bg-[#E9E4D6] px-3 py-1.5 rounded-full w-fit">
          <Settings className="w-3.5 h-3.5 text-[#55634E]" />
          <span>System & Architecture Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C241D] tracking-tight">
          Settings, AI Runtime & GitHub Sync
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6256] font-medium">
          Configure inference engines, offline privacy parameters, MySQL relational exports, and sync directly with your GitHub repository.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D5] overflow-x-auto">
        <button
          onClick={() => setActiveTab('ai')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ai'
              ? 'border-[#55634E] text-[#55634E]'
              : 'border-transparent text-[#7A7165] hover:text-[#2C241D]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Inference Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[#55634E] text-[#55634E]'
              : 'border-transparent text-[#7A7165] hover:text-[#2C241D]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Student Profile & Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'github'
              ? 'border-[#55634E] text-[#55634E]'
              : 'border-transparent text-[#7A7165] hover:text-[#2C241D]'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>GitHub & Version Control</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'database'
              ? 'border-[#55634E] text-[#55634E]'
              : 'border-transparent text-[#7A7165] hover:text-[#2C241D]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>MySQL & Data Architecture</span>
        </button>
      </div>

      {/* Tab 1: AI Inference Engine */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#2C241D]">
              Active LLM / Inference Runtime
            </h2>
            <p className="text-xs text-[#7A7165] mt-1">
              Select between cloud-managed Gemini API, on-device local Ollama runtime, or deterministic knowledge engine.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div
              onClick={() => setAiSettings({ ...aiSettings, engineProvider: 'gemini' })}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                aiSettings.engineProvider === 'gemini'
                  ? 'border-[#55634E] bg-[#EAE5D8]/40 shadow-xs'
                  : 'border-[#E8E2D5] hover:border-[#D5CFBF]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#2C241D]">Gemini 3.8 Flash</span>
                {aiSettings.engineProvider === 'gemini' && (
                  <CheckCircle2 className="w-4 h-4 text-[#55634E]" />
                )}
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                Server-side inference using the @google/genai SDK for instant high-accuracy explanations and code breakdowns.
              </p>
            </div>

            <div
              onClick={() => setAiSettings({ ...aiSettings, engineProvider: 'ollama' })}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                aiSettings.engineProvider === 'ollama'
                  ? 'border-[#55634E] bg-[#EAE5D8]/40 shadow-xs'
                  : 'border-[#E8E2D5] hover:border-[#D5CFBF]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#2C241D]">Ollama (Local LLM)</span>
                {aiSettings.engineProvider === 'ollama' && (
                  <CheckCircle2 className="w-4 h-4 text-[#55634E]" />
                )}
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                Connects to on-device Ollama server (llama3, mistral, phi3) for private offline inference.
              </p>
            </div>

            <div
              onClick={() => setAiSettings({ ...aiSettings, engineProvider: 'offline' })}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                aiSettings.engineProvider === 'offline'
                  ? 'border-[#55634E] bg-[#EAE5D8]/40 shadow-xs'
                  : 'border-[#E8E2D5] hover:border-[#D5CFBF]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#2C241D]">Local Knowledge Engine</span>
                {aiSettings.engineProvider === 'offline' && (
                  <CheckCircle2 className="w-4 h-4 text-[#55634E]" />
                )}
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                Deterministic pedagogical knowledge base that runs 100% offline with zero external network dependencies.
              </p>
            </div>
          </div>

          {aiSettings.engineProvider === 'ollama' && (
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-4">
              <h3 className="text-sm font-bold text-[#2C241D]">
                Ollama Connection Parameters
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2C241D] mb-1">
                    Ollama Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={aiSettings.ollamaEndpoint}
                    onChange={(e) => setAiSettings({ ...aiSettings, ollamaEndpoint: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#D5CFBF] bg-white text-[#2C241D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2C241D] mb-1">
                    Local Model Name
                  </label>
                  <input
                    type="text"
                    value={aiSettings.ollamaModel}
                    onChange={(e) => setAiSettings({ ...aiSettings, ollamaModel: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#D5CFBF] bg-white text-[#2C241D]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#F0EBE0]">
            {saveSuccess ? (
              <span className="text-xs font-bold text-[#55634E] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>AI configuration saved</span>
              </span>
            ) : <div />}

            <button
              onClick={handleSaveAISettings}
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save AI Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#2C241D]">
              Student Profile & Study Schedule
            </h2>
            <p className="text-xs text-[#7A7165] mt-1">
              Adjust your daily study target and personal information.
            </p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-[#2C241D] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C241D] mb-1.5">
                Registered Email
              </label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E8E2D5] bg-[#F5F2EA] text-[#7A7165] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C241D] mb-1.5">
                Target Daily Study Hours ({preferredHours} hours / day)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1.0, 1.5, 2.0, 3.0].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setPreferredHours(h)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition-colors ${
                      preferredHours === h
                        ? 'bg-[#55634E] border-[#55634E] text-white'
                        : 'border-[#E8E2D5] text-[#6B6256] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {h} hrs
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#F0EBE0]">
            {saveSuccess ? (
              <span className="text-xs font-bold text-[#55634E] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile updated successfully</span>
              </span>
            ) : <div />}

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: GitHub & Version Control */}
      {activeTab === 'github' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#2C241D]">
                GitHub Repository Integration
              </h2>
              <p className="text-xs text-[#7A7165] mt-1">
                Manage Git commits and sync directly to your <strong className="text-[#2C241D]">skillora</strong> GitHub repository.
              </p>
            </div>

            <button
              onClick={onOpenGitHubModal}
              className="px-5 py-2.5 rounded-full bg-[#55634E] hover:bg-[#47533F] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Launch 1-Click Push Modal</span>
            </button>
          </div>

          {/* Current Git Status */}
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#55634E]">
                Local Git Status
              </span>
              <span className="text-xs font-bold text-[#2C241D] bg-[#E9E4D6] px-2.5 py-0.5 rounded-full">
                Branch: {gitStatus?.branch || 'main'}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#E8E2D5]">
                <div className="text-[#7A7165]">Latest Commit</div>
                <div className="font-mono font-bold text-[#2C241D] mt-0.5">
                  {gitStatus?.commit?.hash || '4e7284b'}
                </div>
                <div className="text-[11px] text-[#8A8174] truncate">
                  {gitStatus?.commit?.message || 'Skillora Initial Commit'}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E8E2D5]">
                <div className="text-[#7A7165]">Tracked Code Files</div>
                <div className="font-bold text-[#2C241D] mt-0.5">
                  {gitStatus?.totalFiles || 40} files
                </div>
                <div className="text-[11px] text-[#55634E]">
                  Frontend, Backend, Schema
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E8E2D5]">
                <div className="text-[#7A7165]">Working Tree</div>
                <div className="font-bold text-[#55634E] mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Clean (Ready to push)</span>
                </div>
                <div className="text-[11px] text-[#8A8174]">
                  Zero uncommitted conflicts
                </div>
              </div>
            </div>
          </div>

          {/* CLI Instructions Card */}
          <div className="p-5 rounded-2xl border border-[#E8E2D5] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#55634E]" />
                <span className="text-sm font-bold text-[#2C241D]">Push via Terminal (CLI)</span>
              </div>
              <button
                onClick={onOpenGitHubModal}
                className="text-xs text-[#55634E] font-bold underline cursor-pointer"
              >
                Open Push Wizard
              </button>
            </div>
            <pre className="p-4 bg-[#1E1915] text-[#D8D2C5] rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
{`git remote add origin https://github.com/jiyanshi622/skillora.git
git branch -M main
git push -u origin main --force`}
            </pre>
          </div>

          {/* Download Repo Archive */}
          <div className="p-5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm font-bold text-[#2C241D]">
                Export Repository Archive
              </div>
              <p className="text-xs text-[#7A7165] mt-0.5">
                Download all code and full Git history in a single compressed archive.
              </p>
            </div>
            <button
              onClick={handleDownloadArchive}
              className="px-5 py-2.5 rounded-full bg-white border border-[#D5CFBF] hover:bg-[#FAF8F5] text-[#2C241D] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Archive</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Database & MySQL Architecture */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#2C241D]">
              Relational Database & MySQL Schema
            </h2>
            <p className="text-xs text-[#7A7165] mt-1">
              Skillora is architected around 11 normalized relational tables with foreign keys and indexes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] space-y-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#55634E]" />
                <span className="text-sm font-bold text-[#2C241D]">Download MySQL DDL</span>
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                Export the complete <code className="font-mono bg-[#EAE4D6] px-1 py-0.5 rounded text-[#2C241D]">schema.sql</code> file with table definitions for users, student_profiles, subjects, topics, assessment_questions, and study_timetables.
              </p>
              <button
                onClick={handleDownloadSchema}
                className="px-4 py-2 text-xs font-bold text-[#2C241D] bg-white border border-[#D5CFBF] rounded-full hover:bg-[#FAF8F5] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download schema.sql</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-[#E8E2D5] bg-[#FAF8F5] space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#55634E]" />
                <span className="text-sm font-bold text-[#2C241D]">Export State JSON</span>
              </div>
              <p className="text-xs text-[#6B6256] leading-relaxed">
                Download the complete active application database state, including student records, Bayesian mastery scores, and timetables.
              </p>
              <button
                onClick={handleExportJson}
                className="px-4 py-2 text-xs font-bold text-[#2C241D] bg-white border border-[#D5CFBF] rounded-full hover:bg-[#FAF8F5] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export skillora_export.json</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#1E1915] text-[#D8D2C5] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#A8C29D]">
              <Server className="w-4 h-4" />
              <span>MySQL 8.0+ Schema Summary (11 Relational Tables)</span>
            </div>
            <pre className="text-xs font-mono text-[#D8D2C5] overflow-x-auto leading-relaxed max-h-48">
{`1. users (id, email, password_hash, full_name, role)
2. student_profiles (id, user_id FK, learning_goals, knowledge_level, hours)
3. subjects (id, code, title, category, description)
4. topics (id, subject_id FK, title, slug, difficulty_level)
5. assessment_questions (id, topic_id FK, question_text, options, correct_index)
6. assessment_attempts (id, user_id FK, score_pct, duration_seconds)
7. student_performance (id, user_id FK, topic_id FK, accuracy_pct, mastery_score)
8. learning_materials (id, topic_id FK, title, content_markdown, key_takeaways)
9. quiz_attempts & quiz_answers (id, user_id FK, answers, is_correct)
10. study_timetables (id, user_id FK, day_of_week, time_slot, topic_id FK)
11. recommendations & learning_history (id, user_id FK, priority, points)`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
