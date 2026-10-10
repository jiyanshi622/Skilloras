import React, { useState, useEffect } from 'react';
import {
  BookOpen, CheckCircle2, ChevronRight,
  ArrowRight, Code, MessageSquareText,
  Clock, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { Subject, Topic, LearningMaterial } from '../types/index.ts';

interface LearningMaterialsViewProps {
  initialSubjectId?: string;
  initialTopicId?: string;
  onNavigateToPractice: (topicId: string) => void;
  onNavigateToTutor: (topicId: string) => void;
}

export const LearningMaterialsView: React.FC<LearningMaterialsViewProps> = ({
  initialSubjectId,
  initialTopicId,
  onNavigateToPractice,
  onNavigateToTutor,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || '');
  const [activeMaterial, setActiveMaterial] = useState<LearningMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [subs, allTopics, allMats] = await Promise.all([
          api.getSubjects(),
          api.getTopics(),
          api.getMaterials()
        ]);
        setSubjects(subs);
        setTopics(allTopics);
        setMaterials(allMats);

        const subId = initialSubjectId || (subs.length > 0 ? subs[0].id : '');
        setSelectedSubjectId(subId);

        const filteredTopics = allTopics.filter(t => t.subjectId === subId);
        const topId = initialTopicId || (filteredTopics.length > 0 ? filteredTopics[0].id : '');
        setSelectedTopicId(topId);

        const mat = allMats.find(m => m.topicId === topId) || allMats[0] || null;
        setActiveMaterial(mat);
      } catch (err) {
        console.error('Failed to load learning materials:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [initialSubjectId, initialTopicId]);

  const handleSelectSubject = (sId: string) => {
    setSelectedSubjectId(sId);
    const subTopics = topics.filter(t => t.subjectId === sId);
    if (subTopics.length > 0) {
      setSelectedTopicId(subTopics[0].id);
      const mat = materials.find(m => m.topicId === subTopics[0].id) || null;
      setActiveMaterial(mat);
    }
  };

  const handleSelectTopic = (tId: string) => {
    setSelectedTopicId(tId);
    const mat = materials.find(m => m.topicId === tId) || null;
    setActiveMaterial(mat);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#55634E] animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-[#2C241D]">Loading Curriculum Materials...</h2>
        <p className="text-xs text-[#7A7165]">Parsing structured notes and formula breakdowns.</p>
      </div>
    );
  }

  const currentSubjectTopics = topics.filter(t => t.subjectId === selectedSubjectId);
  const currentTopic = topics.find(t => t.id === selectedTopicId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Subject Header Navigation */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#55634E]">
          Curriculum Repository
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C241D] tracking-tight">
          Concept Materials & Notes
        </h1>

        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSelectSubject(sub.id)}
              className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                selectedSubjectId === sub.id
                  ? 'bg-[#382B21] text-white shadow-xs'
                  : 'bg-white border border-[#E8E2D5] text-[#6B6256] hover:border-[#D5CFBE] hover:bg-[#FAF8F4]'
              }`}
            >
              {sub.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Topics List */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D5] p-5 shadow-xs space-y-2">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#8A8174]">
            Modules & Topics ({currentSubjectTopics.length})
          </div>

          <div className="space-y-1">
            {currentSubjectTopics.map((t) => {
              const isSelected = selectedTopicId === t.id;
              const hasNotes = materials.some(m => m.topicId === t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTopic(t.id)}
                  className={`w-full text-left p-3.5 rounded-2xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#EBE5D8] text-[#2C241D] font-bold shadow-2xs'
                      : 'hover:bg-[#FAF8F4] text-[#6B6256] border border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.title}</div>
                    <div className="text-[11px] text-[#7A7165] mt-0.5 capitalize flex items-center gap-1.5">
                      <span>{t.difficultyLevel} Tier</span>
                      <span aria-hidden="true">·</span>
                      <span>~{t.estimatedMinutes} mins</span>
                    </div>
                  </div>
                  {hasNotes ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#55634E] shrink-0" title="Notes Ready" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#C5BDAF] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Stage: Detailed Learning Material Reader */}
        <div className="lg:col-span-8 space-y-6">
          {activeMaterial ? (
            <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs space-y-8 animate-in fade-in duration-200">
              {/* Header */}
              <div className="space-y-3 pb-6 border-b border-[#F0EBE0]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-[#7A7165] font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#55634E]" />
                    <span>{activeMaterial.readingTimeMinutes} min read</span>
                    <span aria-hidden="true">·</span>
                    <span>Curriculum Module</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateToTutor(activeMaterial.topicId)}
                      className="px-3.5 py-1.5 text-xs font-bold text-[#382B21] bg-[#F5F2EA] hover:bg-[#EBE5D8] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquareText className="w-3.5 h-3.5 text-[#55634E]" />
                      <span>Ask AI Tutor</span>
                    </button>

                    <button
                      onClick={() => onNavigateToPractice(activeMaterial.topicId)}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Take Practice Quiz</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="text-2xl font-extrabold text-[#2C241D] tracking-tight leading-snug">
                  {activeMaterial.title}
                </h2>
                <p className="text-sm text-[#6B6256] leading-relaxed">
                  {activeMaterial.summary}
                </p>
              </div>

              {/* Main Content Markdown */}
              <div className="prose prose-slate max-w-none text-sm text-[#473E34] leading-relaxed space-y-4 whitespace-pre-wrap font-normal">
                {activeMaterial.contentMarkdown}
              </div>

              {/* Interactive Concept Simulation Card */}
              {activeMaterial.interactiveExample && (
                <div className="p-6 rounded-3xl bg-[#382B21] text-white space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#DCD4C6] uppercase tracking-wider">
                    <Code className="w-4 h-4 text-[#86957E]" />
                    <span>Interactive Concept Verification</span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    {activeMaterial.interactiveExample.title}
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
                    <div className="p-3 bg-[#4A3C30] rounded-2xl border border-[#5E4E40]">
                      <span className="text-[#C6BBAA] block mb-1">Input Sample:</span>
                      <span className="text-white">{activeMaterial.interactiveExample.input}</span>
                    </div>
                    <div className="p-3 bg-[#4A3C30] rounded-2xl border border-[#5E4E40]">
                      <span className="text-[#86957E] block mb-1">Expected Invariant:</span>
                      <span className="text-white font-bold">{activeMaterial.interactiveExample.expectedOutput}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#D0C6B5] leading-relaxed pt-1">
                    {activeMaterial.interactiveExample.explanation}
                  </p>
                </div>
              )}

              {/* Key Takeaways */}
              <div className="p-6 rounded-3xl bg-[#F6F3EC] border border-[#E8E2D5] space-y-3">
                <div className="text-xs font-bold text-[#55634E] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Conceptual Takeaways</span>
                </div>
                <ul className="space-y-2 text-xs text-[#554A3B]">
                  {activeMaterial.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#55634E] font-bold">·</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-[#F0EBE0] flex items-center justify-between">
                <span className="text-xs text-[#7A7165]">
                  Finished studying this module?
                </span>
                <button
                  onClick={() => onNavigateToPractice(activeMaterial.topicId)}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Solve Active Recall Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8E2D5] p-12 text-center space-y-4">
              <BookOpen className="w-10 h-10 text-[#C5BDAF] mx-auto" />
              <h3 className="text-lg font-bold text-[#2C241D]">
                Notes In Preparation for {currentTopic?.title}
              </h3>
              <p className="text-xs text-[#7A7165] max-w-md mx-auto">
                Detailed notes are being calibrated. You can ask the AI Tutor for a custom derivation or take an adaptive practice quiz right away!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => currentTopic && onNavigateToTutor(currentTopic.id)}
                  className="px-5 py-2.5 text-xs font-bold text-[#382B21] bg-[#F5F2EA] rounded-full hover:bg-[#EBE5D8]"
                >
                  Ask AI Tutor
                </button>
                <button
                  onClick={() => currentTopic && onNavigateToPractice(currentTopic.id)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#55634E] rounded-full hover:bg-[#47533F]"
                >
                  Take Practice Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
