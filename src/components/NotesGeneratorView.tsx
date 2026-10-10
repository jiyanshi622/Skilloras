import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  BookOpen, Sparkles, Download, Youtube, ArrowRight,
  CheckCircle2, AlertCircle, RefreshCw, Bookmark,
  BookmarkCheck, Search, Globe, Flame, Layers,
  ExternalLink, Code, FileText, Check, Copy,
  Wifi, WifiOff, HelpCircle, ChevronRight, Upload
} from 'lucide-react';
import { api } from '../lib/api.ts';
import {
  StudyNote, LanguageCode, NoteDifficulty,
  YouTubeRecommendation, NextTopicSuggestion,
  User, StudentProfile
} from '../types/index.ts';

interface NotesGeneratorViewProps {
  initialTopic?: string;
  initialLanguage?: LanguageCode;
  initialDifficulty?: NoteDifficulty;
  user?: User | null;
  profile?: StudentProfile | null;
  isOffline?: boolean;
  onNavigateToPractice?: (topicId: string) => void;
  onNavigateToTutor?: (topicId: string) => void;
}

const POPULAR_TOPICS = [
  'Binary Search Trees',
  'Dynamic Programming',
  'Neural Networks & AI',
  'Calculus & Derivatives',
  'Python Fundamentals',
  'Laws of Motion',
  'Full-Stack Web Architecture',
  'Asymptotic Big-O Analysis'
];

export function cleanText(str: string | undefined): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/^#{1,6}\s*/gm, '') // remove markdown heading hashes like ###
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold asterisks **text** -> text
    .replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1$2$3') // remove single asterisks *text* -> text
    .replace(/^[\*\-•]\s+/gm, '') // remove leading bullet stars/dashes
    .trim();
}

export const NotesGeneratorView: React.FC<NotesGeneratorViewProps> = ({
  initialTopic,
  initialLanguage = 'en',
  initialDifficulty = 'Beginner',
  user,
  profile,
  isOffline = false,
  onNavigateToPractice,
  onNavigateToTutor
}) => {
  const [topicInput, setTopicInput] = useState(initialTopic || 'Binary Search Trees');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(initialLanguage);
  const [selectedDifficulty, setSelectedDifficulty] = useState<NoteDifficulty>(initialDifficulty);
  const [uploadedMaterial, setUploadedMaterial] = useState('');
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
  const [currentNote, setCurrentNote] = useState<StudyNote | null>(null);
  const [savedNotes, setSavedNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());
  const [savedFilterQuery, setSavedFilterQuery] = useState('');

  // Load saved notes on mount
  useEffect(() => {
    loadSavedNotes();
  }, []);

  // When initialTopic is passed, automatically generate or display notes
  useEffect(() => {
    if (initialTopic) {
      setTopicInput(initialTopic);
      handleGenerate(initialTopic, selectedLanguage, selectedDifficulty);
    } else {
      // Generate default sample note on first view
      handleGenerate('Binary Search Trees', selectedLanguage, selectedDifficulty);
    }
  }, [initialTopic]);

  const loadSavedNotes = async () => {
    try {
      const list = await api.getSavedNotes();
      setSavedNotes(list);
    } catch (err) {
      console.warn('Failed to load saved notes:', err);
    }
  };

  const handleGenerate = async (
    targetTopic: string = topicInput,
    lang: LanguageCode = selectedLanguage,
    diff: NoteDifficulty = selectedDifficulty
  ) => {
    if (!targetTopic.trim()) return;
    setLoading(true);
    setSelectedQuizAnswers({});

    try {
      const note = await api.generateNotes({
        topic: targetTopic.trim(),
        language: lang,
        difficulty: diff,
        uploadedMaterial: uploadedMaterial.trim() || undefined
      });

      // Check if note is already saved in offline library
      const local = api.getLocalSavedNotes();
      const isSaved = local.some(n => n.id === note.id || (n.topic.toLowerCase() === note.topic.toLowerCase() && n.language === note.language));
      note.isSavedOffline = isSaved;

      setCurrentNote(note);
      setActiveTab('generate');
    } catch (err: any) {
      console.error('Notes generation error:', err);
      // Fallback: search local saved notes
      const local = api.getLocalSavedNotes();
      const fallback = local.find(n => n.topic.toLowerCase().includes(targetTopic.toLowerCase()));
      if (fallback) {
        setCurrentNote(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSaveOffline = async () => {
    if (!currentNote) return;
    const isCurrentlySaved = currentNote.isSavedOffline;

    if (isCurrentlySaved) {
      await api.deleteSavedNote(currentNote.id);
      setCurrentNote({ ...currentNote, isSavedOffline: false });
      setSavedNotes(prev => prev.filter(n => n.id !== currentNote.id));
    } else {
      const saved = await api.saveNote(currentNote);
      setCurrentNote({ ...saved, isSavedOffline: true });
      setSavedNotes(prev => [saved, ...prev.filter(n => n.id !== saved.id)]);
    }
  };

  const handleDownloadPdf = () => {
    if (!currentNote) return;
    setDownloadingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Helper to check page break
      const checkPageBreak = (requiredHeight: number) => {
        if (y + requiredHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Header Banner
      doc.setFillColor(56, 43, 33); // Mocha primary
      doc.rect(margin, y, contentWidth, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('Skillora - Personalized Study Notes', margin + 6, y + 9);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(218, 209, 195);
      doc.text(`On-Device Learning Assistant  ·  Difficulty: ${currentNote.difficulty}  ·  Language: ${currentNote.languageLabel}`, margin + 6, y + 16);

      y += 28;

      // Topic Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(44, 36, 29);
      const titleLines = doc.splitTextToSize(currentNote.topic, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 8 + 2;

      // Metadata Strip
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 98, 86);
      doc.text(`Generated: ${new Date(currentNote.createdAt).toLocaleDateString()} | Tier: ${currentNote.difficulty} | Student Level: ${profile?.estimatedKnowledgeLevel || 'Developing'}`, margin, y);
      y += 8;

      // Divider line
      doc.setDrawColor(220, 211, 195);
      doc.setLineWidth(0.4);
      doc.line(margin, y, margin + contentWidth, y);
      y += 6;

      // Summary
      checkPageBreak(25);
      doc.setFillColor(245, 242, 234);
      doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(85, 99, 78); // Sage green
      doc.text('EXECUTIVE SUMMARY', margin + 5, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(56, 43, 33);
      const summaryLines = doc.splitTextToSize(currentNote.summary, contentWidth - 10);
      doc.text(summaryLines, margin + 5, y + 12);
      y += 26;

      // Key Points
      if (currentNote.keyPoints && currentNote.keyPoints.length > 0) {
        checkPageBreak(30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(44, 36, 29);
        doc.text('Important Key Points & Invariants', margin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(56, 43, 33);
        currentNote.keyPoints.forEach(kp => {
          checkPageBreak(12);
          const lines = doc.splitTextToSize(`•  ${kp}`, contentWidth - 6);
          doc.text(lines, margin + 3, y);
          y += lines.length * 5 + 2;
        });
        y += 4;
      }

      // Sections
      if (currentNote.sections && currentNote.sections.length > 0) {
        currentNote.sections.forEach(sec => {
          checkPageBreak(30);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(44, 36, 29);
          doc.text(sec.heading, margin, y);
          y += 6;

          if (sec.explanation) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(71, 62, 52);
            const explLines = doc.splitTextToSize(sec.explanation, contentWidth);
            doc.text(explLines, margin, y);
            y += explLines.length * 5 + 3;
          }

          if (sec.bulletPoints && sec.bulletPoints.length > 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(56, 43, 33);
            sec.bulletPoints.forEach(bp => {
              checkPageBreak(12);
              const bpLines = doc.splitTextToSize(`-  ${bp}`, contentWidth - 6);
              doc.text(bpLines, margin + 4, y);
              y += bpLines.length * 4.5 + 1.5;
            });
          }
          y += 5;
        });
      }

      // Concrete Examples
      if (currentNote.examples && currentNote.examples.length > 0) {
        checkPageBreak(35);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(44, 36, 29);
        doc.text('Concrete Application Examples', margin, y);
        y += 6;

        currentNote.examples.forEach(ex => {
          checkPageBreak(30);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(85, 99, 78);
          doc.text(ex.title, margin + 2, y);
          y += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(56, 43, 33);
          const descLines = doc.splitTextToSize(ex.description, contentWidth - 4);
          doc.text(descLines, margin + 2, y);
          y += descLines.length * 4.5 + 3;

          if (ex.codeOrFormula) {
            doc.setFillColor(240, 237, 230);
            const codeLines = doc.splitTextToSize(ex.codeOrFormula, contentWidth - 10);
            const codeBoxHeight = codeLines.length * 4 + 6;
            checkPageBreak(codeBoxHeight + 5);
            doc.roundedRect(margin, y, contentWidth, codeBoxHeight, 2, 2, 'F');
            doc.setFont('courier', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(44, 36, 29);
            doc.text(codeLines, margin + 5, y + 5);
            y += codeBoxHeight + 5;
          }
        });
      }

      // Practice Questions
      if (currentNote.practiceQuestions && currentNote.practiceQuestions.length > 0) {
        checkPageBreak(35);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(44, 36, 29);
        doc.text('Self-Assessment Practice Questions', margin, y);
        y += 6;

        currentNote.practiceQuestions.forEach((q, idx) => {
          checkPageBreak(25);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(56, 43, 33);
          const qLines = doc.splitTextToSize(`Q${idx + 1}: ${q.question}`, contentWidth);
          doc.text(qLines, margin, y);
          y += qLines.length * 4.5 + 2;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          q.options.forEach((opt, optIdx) => {
            const isCorrect = optIdx === q.correctIndex;
            doc.setTextColor(isCorrect ? 85 : 90, isCorrect ? 99 : 90, isCorrect ? 78 : 90);
            doc.text(`   [${String.fromCharCode(65 + optIdx)}] ${opt} ${isCorrect ? '✓' : ''}`, margin + 2, y);
            y += 4.5;
          });
          y += 3;
        });
      }

      // Footer
      checkPageBreak(15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(140, 130, 115);
      doc.text('Skillora AI On-Device Personalized Learning Platform · Designed for Offline Reading', margin, y + 6);

      // Save PDF file
      const safeFilename = `${currentNote.topic.toLowerCase().replace(/[^a-z0-9]/g, '_')}_notes_${currentNote.language}.pdf`;
      doc.save(safeFilename);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const handleSelectQuizOption = (qIdx: number, optIdx: number) => {
    setSelectedQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleNextTopicClick = (suggestion: NextTopicSuggestion) => {
    setTopicInput(suggestion.topicTitle);
    setSelectedDifficulty(suggestion.difficulty);
    handleGenerate(suggestion.topicTitle, selectedLanguage, suggestion.difficulty);
    setCompletedTopicIds(prev => new Set(prev).add(suggestion.id));
  };

  const filteredSavedNotes = savedNotes.filter(n =>
    n.topic.toLowerCase().includes(savedFilterQuery.toLowerCase()) ||
    n.summary.toLowerCase().includes(savedFilterQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Offline Status Alert if disconnected */}
      {isOffline && (
        <div className="bg-[#EBE3D0] border border-[#DCD3BE] rounded-3xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#634E28] text-white flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#45371E] block">Offline Learning Mode Active</span>
              <span className="text-[#6B5A3E]">
                All saved notes and local deterministic notes synthesis remain fully accessible without an internet connection.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('saved')}
            className="px-4 py-2 bg-white text-[#45371E] font-bold rounded-full border border-[#D5CFBE] hover:bg-[#FAF8F5] transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            View Saved Notes ({savedNotes.length})
          </button>
        </div>
      )}

      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-[#E8E2D5]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-full bg-[#EBE5D8] text-[#55634E]">
              AI Study Companion
            </span>
            <span className="text-xs text-[#7A7165]">
              {profile ? `Optimized for ${profile.estimatedKnowledgeLevel} Knowledge Tier` : 'Adaptive Pedagogical Engine'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2C241D] tracking-tight">
            AI-Powered Notes Generator
          </h1>
          <p className="text-sm text-[#6B6256] max-w-2xl">
            Generate easy-to-understand study notes in <span className="font-semibold text-[#2C241D]">English, Hindi, or Gujarati</span>, tailored to your chosen depth with verified YouTube video recommendations and offline PDF downloads.
          </p>
        </div>

        {/* Tab switch: Generate vs Saved */}
        <div className="flex items-center p-1 bg-[#EBE5D8] rounded-full shrink-0">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-white text-[#2C241D] shadow-xs'
                : 'text-[#6B6256] hover:text-[#2C241D]'
            }`}
          >
            Generate Notes
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-white text-[#2C241D] shadow-xs'
                : 'text-[#6B6256] hover:text-[#2C241D]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Offline ({savedNotes.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'saved' ? (
        /* ============================================================ */
        /* TAB 2: SAVED OFFLINE NOTES ARCHIVE                            */
        /* ============================================================ */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8174]" />
              <input
                type="text"
                placeholder="Search your saved offline notes..."
                value={savedFilterQuery}
                onChange={(e) => setSavedFilterQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2D5] rounded-full text-xs text-[#2C241D] focus:outline-none focus:border-[#55634E] shadow-2xs"
              />
            </div>
            <div className="text-xs text-[#7A7165]">
              {filteredSavedNotes.length} notes saved locally on this device
            </div>
          </div>

          {filteredSavedNotes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8E2D5] p-12 text-center space-y-4">
              <Bookmark className="w-10 h-10 text-[#C5BDAF] mx-auto" />
              <h3 className="text-lg font-bold text-[#2C241D]">No Saved Notes Yet</h3>
              <p className="text-xs text-[#7A7165] max-w-md mx-auto">
                Generate study notes on any topic and click <span className="font-semibold text-[#55634E]">Save for Offline</span> to access them anytime without internet!
              </p>
              <button
                onClick={() => setActiveTab('generate')}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs cursor-pointer"
              >
                Generate First Study Note
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSavedNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-[#EBE5D8] text-[#55634E]">
                        {note.languageLabel}
                      </span>
                      <span className="text-[11px] font-bold text-[#8A8174] uppercase">
                        {note.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#2C241D] leading-snug">
                      {note.topic}
                    </h3>

                    <p className="text-xs text-[#6B6256] line-clamp-3 leading-relaxed">
                      {note.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#F0EBE0] flex items-center justify-between">
                    <span className="text-[11px] text-[#8A8174]">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        setCurrentNote(note);
                        setActiveTab('generate');
                      }}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-[#382B21] hover:bg-[#2C221A] rounded-full flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Read Note</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* TAB 1: GENERATE STUDY NOTES                                   */
        /* ============================================================ */
        <div className="space-y-8">
          {/* Controls Bar: Topic, Language, Difficulty, Generate */}
          <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs space-y-5">
            <div className="grid md:grid-cols-12 gap-4 items-center">
              {/* Topic Search Input */}
              <div className="md:col-span-5 relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7165] mb-1.5">
                  Enter Learning Topic or Concept
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8174]" />
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="e.g. Binary Search Trees, Dynamic Programming..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl text-xs text-[#2C241D] font-medium focus:outline-none focus:border-[#55634E] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Language Selector (3 options as requested) */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7165] mb-1.5">
                  Learning Language
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#55634E]" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
                    className="w-full pl-9 pr-8 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl text-xs font-semibold text-[#2C241D] appearance-none focus:outline-none focus:border-[#55634E] cursor-pointer shadow-2xs"
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
                    <option value="gu">🇮🇳 Gujarati (ગુજરાતી)</option>
                  </select>
                  <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8174] pointer-events-none rotate-90" />
                </div>
              </div>

              {/* Difficulty Level Selector */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7165] mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as NoteDifficulty)}
                  className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl text-xs font-semibold text-[#2C241D] appearance-none focus:outline-none focus:border-[#55634E] cursor-pointer shadow-2xs"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              {/* Generate Button */}
              <div className="md:col-span-2 pt-5">
                <button
                  onClick={() => handleGenerate()}
                  disabled={loading || !topicInput.trim()}
                  className="w-full py-2.5 px-4 bg-[#55634E] hover:bg-[#47533F] disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Notes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Topic Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
              <span className="text-[11px] font-bold text-[#8A8174] whitespace-nowrap shrink-0">
                Popular Topics:
              </span>
              {POPULAR_TOPICS.map((pt) => (
                <button
                  key={pt}
                  onClick={() => {
                    setTopicInput(pt);
                    handleGenerate(pt, selectedLanguage, selectedDifficulty);
                  }}
                  className="px-3 py-1 bg-[#F5F2EA] hover:bg-[#EBE5D8] text-[#554A3B] text-[11px] font-medium rounded-full whitespace-nowrap shrink-0 transition-colors border border-[#E8E2D5] cursor-pointer"
                >
                  {pt}
                </button>
              ))}
            </div>

            {/* Upload/Paste Custom Material Toggle */}
            <div className="pt-2 border-t border-[#F0EBE0] flex items-center justify-between text-xs">
              <button
                onClick={() => setShowUploadPanel(!showUploadPanel)}
                className="text-[#55634E] font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{showUploadPanel ? 'Hide Material Upload' : 'Upload or Paste Custom Learning Material'}</span>
              </button>
              <span className="text-[11px] text-[#8A8174]">
                Supports notes generation based on your syllabus, lecture excerpts, or homework questions.
              </span>
            </div>

            {showUploadPanel && (
              <div className="pt-2 space-y-2 animate-in fade-in">
                <textarea
                  rows={3}
                  value={uploadedMaterial}
                  onChange={(e) => setUploadedMaterial(e.target.value)}
                  placeholder="Paste lecture excerpt, textbook page text, or curriculum syllabus here to synthesize notes..."
                  className="w-full p-3 bg-[#FAF8F5] border border-[#E8E2D5] rounded-2xl text-xs text-[#2C241D] focus:outline-none focus:border-[#55634E]"
                />
              </div>
            )}
          </div>

          {/* Loading State Animation */}
          {loading && (
            <div className="bg-white rounded-3xl border border-[#E8E2D5] p-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-3 border-[#55634E] border-t-transparent animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-[#2C241D]">
                Synthesizing Study Notes in {selectedLanguage === 'hi' ? 'Hindi (हिन्दी)' : selectedLanguage === 'gu' ? 'Gujarati (ગુજરાતી)' : 'English'}...
              </h3>
              <p className="text-xs text-[#7A7165] max-w-md mx-auto">
                Calibrating depth for {selectedDifficulty} level, formatting key takeaways, curating verified YouTube lessons, and preparing offline bundle.
              </p>
            </div>
          )}

          {/* Notes Reader Stage */}
          {!loading && currentNote && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Note Header & Action Ribbon */}
              <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#F0EBE0]">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 bg-[#EBE5D8] text-[#55634E] text-xs font-bold rounded-full">
                      {currentNote.languageLabel}
                    </span>
                    <span className="px-3 py-1 bg-[#F5F2EA] text-[#382B21] text-xs font-bold rounded-full border border-[#E8E2D5]">
                      {currentNote.difficulty} Tier
                    </span>
                    <span className="text-xs text-[#8A8174] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#55634E]" />
                      <span>{currentNote.engineUsed || 'Skillora Engine'}</span>
                    </span>
                  </div>

                  {/* Primary Action Buttons: Save Offline & Download PDF */}
                  <div className="flex items-center gap-2.5">
                    {/* Toggle Save Offline */}
                    <button
                      onClick={handleToggleSaveOffline}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        currentNote.isSavedOffline
                          ? 'bg-[#EBF3E8] border-[#A8C7A0] text-[#3B5434]'
                          : 'bg-[#FAF8F5] border-[#E8E2D5] text-[#6B6256] hover:bg-[#F0ECE1]'
                      }`}
                      title={currentNote.isSavedOffline ? 'Saved locally for offline study' : 'Save note to local storage'}
                    >
                      {currentNote.isSavedOffline ? (
                        <>
                          <BookmarkCheck className="w-4 h-4 text-[#3B5434]" />
                          <span>Saved Offline</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          <span>Save Offline</span>
                        </>
                      )}
                    </button>

                    {/* Download Notes PDF */}
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="px-5 py-2 bg-[#55634E] hover:bg-[#47533F] disabled:opacity-50 text-white rounded-full text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {downloadingPdf ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Download Notes (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* Topic Title & Summary */}
                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C241D] tracking-tight leading-snug">
                    {cleanText(currentNote.topic)}
                  </h2>
                  <p className="text-sm text-[#4A4036] leading-relaxed bg-[#FAF8F5] p-5 rounded-2xl border border-[#F0ECE1]">
                    {cleanText(currentNote.summary)}
                  </p>
                </div>

                {/* Important Key Points Callout */}
                {currentNote.keyPoints && currentNote.keyPoints.length > 0 && (
                  <div className="p-6 rounded-3xl bg-[#F6F3EC] border border-[#E8E2D5] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#55634E]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Important Key Points & Exam Takeaways</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-[#473E34]">
                      {currentNote.keyPoints.map((kp, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#55634E] shrink-0 mt-1.5" />
                          <span>{cleanText(kp)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Structured Sections */}
                <div className="space-y-8 pt-4">
                  {currentNote.sections && currentNote.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="text-lg font-bold text-[#2C241D] tracking-tight flex items-center gap-2">
                        <span>{cleanText(sec.heading)}</span>
                      </h3>

                      {sec.explanation && (
                        <p className="text-xs sm:text-sm text-[#554A3E] leading-relaxed">
                          {cleanText(sec.explanation)}
                        </p>
                      )}

                      {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                        <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                          {sec.bulletPoints.map((bp, bpIdx) => (
                            <div
                              key={bpIdx}
                              className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D5]/70 text-xs text-[#473E34] leading-relaxed flex items-start gap-2"
                            >
                              <span className="text-[#55634E] font-bold">·</span>
                              <span>{cleanText(bp)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Concrete Examples with Code/Formulas */}
                {currentNote.examples && currentNote.examples.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-[#F0EBE0]">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#55634E]">
                      <Code className="w-4 h-4" />
                      <span>Concrete Examples & Implementation</span>
                    </div>

                    <div className="space-y-4">
                      {currentNote.examples.map((ex, exIdx) => (
                        <div key={exIdx} className="bg-[#382B21] text-white rounded-3xl p-6 space-y-3">
                          <h4 className="text-sm font-bold text-white">
                            {ex.title}
                          </h4>
                          <p className="text-xs text-[#D8CFBE] leading-relaxed">
                            {ex.description}
                          </p>

                          {ex.codeOrFormula && (
                            <div className="relative pt-2">
                              <button
                                onClick={() => handleCopyCode(ex.codeOrFormula || '', exIdx)}
                                className="absolute right-3 top-4 px-2.5 py-1 text-[11px] font-semibold bg-[#4E3F33] hover:bg-[#604F41] text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedCodeIdx === exIdx ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <pre className="p-4 bg-[#2C2119] rounded-2xl font-mono text-xs text-amber-100 overflow-x-auto leading-relaxed border border-[#524134]">
                                <code>{ex.codeOrFormula}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* SECTION 3: DIRECT YOUTUBE LEARNING LINKS (FEATURE 3)          */}
              {/* ============================================================ */}
              <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EBE0]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700">
                      <Youtube className="w-4 h-4 text-red-600" />
                      <span>Recommended YouTube Video Lessons</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#2C241D]">
                      Watch Valid Educational Tutorials for {currentNote.topic}
                    </h3>
                  </div>

                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentNote.topic + (currentNote.language === 'hi' ? ' in hindi' : currentNote.language === 'gu' ? ' in gujarati' : ' tutorial'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#55634E] hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>Search more on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentNote.youtubeVideos && currentNote.youtubeVideos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-[#FAF8F5] rounded-3xl border border-[#E8E2D5] overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      {/* Video Thumbnail with YouTube Red Play Badge */}
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback image if thumbnail fails
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id}/0.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                        {video.duration && (
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-mono font-bold rounded">
                            {video.duration}
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-white/90 backdrop-blur-xs text-[#2C241D] text-[10px] font-bold rounded-full capitalize">
                          {video.language === 'hi' ? 'Hindi' : video.language === 'gu' ? 'Gujarati' : 'English'} · {video.difficulty}
                        </div>
                      </div>

                      {/* Video Info & Direct Watch Button */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-[#8A8174]">
                            {video.channelTitle}
                          </span>
                          <h4 className="text-sm font-bold text-[#2C241D] line-clamp-2 leading-snug group-hover:text-[#55634E] transition-colors">
                            {video.title}
                          </h4>
                        </div>

                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                        >
                          <Youtube className="w-4 h-4 fill-white" />
                          <span>Watch on YouTube</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Self-Assessment Practice Quiz */}
              {currentNote.practiceQuestions && currentNote.practiceQuestions.length > 0 && (
                <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs space-y-6">
                  <div className="space-y-1 pb-4 border-b border-[#F0EBE0]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#55634E]">
                      Knowledge Check
                    </span>
                    <h3 className="text-xl font-extrabold text-[#2C241D]">
                      Quick Self-Assessment Practice
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {currentNote.practiceQuestions.map((q, qIdx) => {
                      const selectedOpt = selectedQuizAnswers[qIdx];
                      const hasAnswered = selectedOpt !== undefined;
                      const isCorrect = selectedOpt === q.correctIndex;

                      return (
                        <div key={qIdx} className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-4">
                          <h4 className="text-sm font-bold text-[#2C241D]">
                            Q{qIdx + 1}: {q.question}
                          </h4>

                          <div className="grid sm:grid-cols-2 gap-2.5">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedOpt === optIdx;
                              let btnClass = 'bg-white border-[#E8E2D5] text-[#473E34] hover:bg-[#F5F2EA]';

                              if (hasAnswered) {
                                if (optIdx === q.correctIndex) {
                                  btnClass = 'bg-[#EBF3E8] border-[#A8C7A0] text-[#2C4A25] font-bold';
                                } else if (isSelected) {
                                  btnClass = 'bg-rose-50 border-rose-300 text-rose-800 font-bold';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                                  className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${btnClass}`}
                                >
                                  <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                  {hasAnswered && optIdx === q.correctIndex && (
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {hasAnswered && (
                            <div className={`p-3 rounded-xl text-xs ${isCorrect ? 'bg-[#EBF3E8] text-[#2C4A25]' : 'bg-amber-50 text-amber-900'} border border-transparent`}>
                              <span className="font-bold block mb-0.5">{isCorrect ? '✓ Correct Answer!' : 'Note on Solution:'}</span>
                              <span>{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SECTION 5: PERSONALIZED NEXT-TOPIC SUGGESTIONS (FEATURE 5)    */}
              {/* ============================================================ */}
              {currentNote.nextTopics && currentNote.nextTopics.length > 0 && (
                <div className="bg-white rounded-3xl border border-[#E8E2D5] p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EBE0]">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#55634E]">
                        Adaptive Learning Progression
                      </span>
                      <h3 className="text-xl font-extrabold text-[#2C241D]">
                        What to Learn Next?
                      </h3>
                      <p className="text-xs text-[#7A7165]">
                        Personalized topics arranged logically from basic to advanced concepts based on your current study module.
                      </p>
                    </div>

                    <div className="text-xs text-[#55634E] font-bold">
                      {completedTopicIds.size} completed in this session
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {currentNote.nextTopics.map((nt) => {
                      const isCompleted = completedTopicIds.has(nt.id);

                      return (
                        <div
                          key={nt.id}
                          className="bg-[#FAF8F5] rounded-3xl border border-[#E8E2D5] p-6 flex flex-col justify-between space-y-4 hover:border-[#D5CFBE] transition-all"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-bold text-[#8A8174]">
                                Step #{nt.order}
                              </span>
                              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#EBE5D8] text-[#55634E]">
                                {nt.difficulty}
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-[#2C241D] leading-snug">
                              {nt.topicTitle}
                            </h4>

                            <p className="text-xs text-[#6B6256] leading-relaxed">
                              {nt.description}
                            </p>

                            <div className="text-[11px] text-[#8A8174] italic">
                              Why: {nt.reason}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#E8E2D5]/60 flex items-center justify-between">
                            {isCompleted ? (
                              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Completed</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#8A8174]">Ready to study</span>
                            )}

                            <button
                              onClick={() => handleNextTopicClick(nt)}
                              className="px-4 py-2 bg-[#382B21] hover:bg-[#261D16] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <span>Generate Notes</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
