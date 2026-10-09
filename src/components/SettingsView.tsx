import React, { useState, useEffect } from 'react';
import {
  Settings, User, Cpu, Database, Volume2,
  Download, RefreshCw, CheckCircle2, Shield,
  HardDrive, Code, Server
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { User as UserType, StudentProfile, AISettings } from '../types/index.ts';

interface SettingsViewProps {
  user: UserType;
  profile: StudentProfile;
  onProfileUpdated: (profile: StudentProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  profile,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'profile' | 'database'>('ai');
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

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await api.getSettings();
        setAiSettings(s);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md w-fit">
          <Settings className="w-3.5 h-3.5" />
          <span>System & Architecture Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & AI Runtime
        </h1>
        <p className="text-sm text-slate-600">
          Configure inference engines, offline privacy parameters, and relational database exports.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ai')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'ai'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Inference Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Student Profile & Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'database'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>MySQL & Data Architecture</span>
        </button>
      </div>

      {/* Tab 1: AI Inference Engine */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-8 animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Active LLM / Inference Runtime
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select between cloud-managed Gemini API, on-device local Ollama runtime, or offline deterministic engine.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div
              onClick={() => setAiSettings({ ...aiSettings, engineProvider: 'gemini' })}
              className={`p-5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                aiSettings.engineProvider === 'gemini'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Gemini 3.8 Flash</span>
                {aiSettings.engineProvider === 'gemini' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Server-side inference using the @google/genai SDK for instant high-accuracy explanations and code breakdowns.
              </p>
            </div>

            <div
              onClick={() => setAiSettings({ ...aiSettings, engineProvider: 'ollama' })}
              className={`p-5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                aiSettings.engineProvider === 'ollama'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Ollama (Local LLM)</span>
                {aiSettings.engineProvider === 'ollama' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connects to on-device Ollama server (llama3, mistral, phi3) for private offline inference.
              </p>
            </div>

            <div
              onClick={() => setAiSettings({ ...aiSettings, engineProvider: 'offline' })}
              className={`p-5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                aiSettings.engineProvider === 'offline'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Local Knowledge Engine</span>
                {aiSettings.engineProvider === 'offline' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Deterministic pedagogical knowledge base that runs 100% offline with zero external network dependencies.
              </p>
            </div>
          </div>

          {aiSettings.engineProvider === 'ollama' && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Ollama Connection Parameters
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ollama Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={aiSettings.ollamaEndpoint}
                    onChange={(e) => setAiSettings({ ...aiSettings, ollamaEndpoint: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Local Model Name
                  </label>
                  <input
                    type="text"
                    value={aiSettings.ollamaModel}
                    onChange={(e) => setAiSettings({ ...aiSettings, ollamaModel: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Run <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">ollama run {aiSettings.ollamaModel}</code> on your local workstation before testing.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {saveSuccess ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings saved successfully</span>
              </span>
            ) : <div />}

            <button
              onClick={handleSaveAISettings}
              disabled={saving}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save AI Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Student Profile & Time Commitment
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Adjust your daily study target to trigger automatic re-computation of timetable slot durations.
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email
              </label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Daily Study Hours ({preferredHours} hours / day)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1.0, 1.5, 2.0, 3.0].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setPreferredHours(h)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                      preferredHours === h
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {h} hrs
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            {saveSuccess ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile updated successfully</span>
              </span>
            ) : <div />}

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Database & MySQL Architecture */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Relational Database & MySQL Schema
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Skillora is architected around 11 normalized relational tables with foreign keys and indexes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-900">Download MySQL DDL</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export the complete <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">schema.sql</code> file with table definitions for users, student_profiles, subjects, topics, assessment_questions, and study_timetables.
              </p>
              <button
                onClick={handleDownloadSchema}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download schema.sql</span>
              </button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">Export State JSON</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download the complete active application database state, including student records, Bayesian mastery scores, and timetables.
              </p>
              <button
                onClick={handleExportJson}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export skillora_export.json</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 text-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Server className="w-4 h-4" />
              <span>MySQL 8.0+ Schema Summary (11 Relational Tables)</span>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-48">
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
