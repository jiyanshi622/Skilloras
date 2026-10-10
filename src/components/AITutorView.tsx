import React, { useState, useEffect, useRef } from 'react';
import {
  Send, User as UserIcon, Volume2,
  VolumeX, RefreshCw, Cpu, Paperclip,
  Image as ImageIcon, FileText, X, RotateCcw,
  Sparkles, Check, Copy, Search, Eye
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { Topic, ChatMessage, ChatAttachment } from '../types/index.ts';

interface AITutorViewProps {
  initialTopicId?: string;
  onNavigateToPractice?: (topicId: string) => void;
}

const MODES = [
  { id: 'standard', label: 'Rigorous Standard', desc: 'Balanced pedagogical instruction' },
  { id: 'eli5', label: 'ELI5 (Simple Analogy)', desc: 'Intuitive physical analogies' },
  { id: 'step_by_step', label: 'Step-by-Step', desc: 'Numbered trace with formulas' },
  { id: 'real_world', label: 'Real-World Systems', desc: 'Production engineering context' },
  { id: 'quiz_prep', label: 'Exam Drill', desc: 'High-yield interview / exam pitfalls' }
];

const SUGGESTED_QUESTIONS = [
  "Can you give me a real-world intuition for this concept?",
  "What is the most common mistake students make here?",
  "Walk me through a concrete code trace step-by-step",
  "How does this relate to other topics in my curriculum?",
  "Give me an active recall question to test my understanding"
];

const CHAT_STORAGE_KEY = 'skillora_ai_tutor_history_v2';

export const AITutorView: React.FC<AITutorViewProps> = ({
  initialTopicId,
  onNavigateToPractice
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || '');
  const [mode, setMode] = useState<string>('standard');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [hasResumedChat, setHasResumedChat] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Restore previous chat history so chat starts where user left off
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setHasResumedChat(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load chat history from localStorage');
    }

    // Default first welcome message if no history
    const currentTopic = topics.find(t => t.id === selectedTopicId);
    const topicTitle = currentTopic ? currentTopic.title : 'General Computer Science & STEM';
    setMessages([
      {
        id: 'msg_initial',
        sender: 'assistant',
        text: `Hello! I am your Skillora AI Tutor. We are currently focusing on ${topicTitle}.\n\nYou can ask any question, upload images/diagrams or code files for multimodal analysis, request an intuitive analogy (ELI5), or get a step-by-step trace!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: 'Skillora Neural Assistant'
      }
    ]);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.warn('Failed to save chat to localStorage');
      }
    }
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleClearHistory = () => {
    const currentTopic = topics.find(t => t.id === selectedTopicId);
    const topicTitle = currentTopic ? currentTopic.title : 'General Computer Science & STEM';
    const initial: ChatMessage[] = [
      {
        id: `msg_${Date.now()}`,
        sender: 'assistant',
        text: `Fresh study session started for ${topicTitle}. What concept would you like to explore or analyze?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: 'Skillora Neural Assistant'
      }
    ];
    setMessages(initial);
    setHasResumedChat(false);
    setAttachments([]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'application/octet-stream',
            dataUrl,
            size: file.size
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputMessage;
    if ((!text.trim() && attachments.length === 0) || loading) return;

    const currentAttachments = [...attachments];
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setAttachments([]);
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const res = await api.askAITutor({
        topicId: selectedTopicId,
        userQuery: text.trim() || 'Analyze attached file',
        mode: mode as any,
        chatHistory: historyPayload,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
        removeExtraSymbols: true
      });

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: res.engine
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant_err_${Date.now()}`,
        sender: 'assistant',
        text: "I couldn't reach the model endpoint right now. You can continue reading verified materials or try switching to the deterministic Knowledge Engine in Settings.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: 'Fallback Engine'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        window.speechSynthesis.cancel();
        const clean = text.replace(/[*_#`~]/g, '');
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.05;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  const copyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(id);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Render assistant text without extra raw symbols (clean headings, bold, bullet points, code)
  const renderCleanMessageText = (rawText: string, messageId: string) => {
    if (!rawText) return null;

    // Split code blocks if any
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let codeBlockCount = 0;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      const textBefore = rawText.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(renderFormattedParagraphs(textBefore, `${messageId}_p_${lastIndex}`));
      }

      const lang = match[1] || 'code';
      const code = match[2];
      const codeId = `${messageId}_code_${codeBlockCount++}`;
      parts.push(
        <div key={codeId} className="my-3 rounded-2xl bg-[#2C241D] text-[#E0D8CB] border border-[#44382B] overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1F1812] border-b border-[#3D3225] text-[11px] font-mono">
            <span className="text-[#A89E8D] uppercase font-bold">{lang}</span>
            <button
              onClick={() => copyCode(code, codeId)}
              className="text-[#D8CFBF] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedCodeIdx === codeId ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 text-xs font-mono overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    const remainingText = rawText.substring(lastIndex);
    if (remainingText) {
      parts.push(renderFormattedParagraphs(remainingText, `${messageId}_p_${lastIndex}`));
    }

    return parts;
  };

  // Helper to format paragraphs and strip raw symbols cleanly
  const renderFormattedParagraphs = (text: string, keyPrefix: string) => {
    const lines = text.split('\n');
    return (
      <div key={keyPrefix} className="space-y-1.5">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Check for heading (### or ##)
          if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            const headingText = trimmed.replace(/^#{1,6}\s*/, '');
            return (
              <h4 key={idx} className="text-sm font-extrabold text-[#2C241D] mt-2 mb-1">
                {cleanInlineSymbols(headingText)}
              </h4>
            );
          }

          // Check for bullet items (*, -, •)
          if (/^[\*\-•]\s+/.test(trimmed)) {
            const itemText = trimmed.replace(/^[\*\-•]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5 py-0.5 text-xs sm:text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#55634E] shrink-0 mt-2" />
                <span className="flex-1 text-[#2C241D] leading-relaxed">
                  {renderInlineFormatted(itemText)}
                </span>
              </div>
            );
          }

          // Check for numbered items (1., 2.)
          if (/^\d+\.\s+/.test(trimmed)) {
            const num = trimmed.match(/^\d+\./)![0];
            const itemText = trimmed.replace(/^\d+\.\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 py-0.5 text-xs sm:text-sm">
                <span className="font-bold text-[#55634E] shrink-0">{num}</span>
                <span className="flex-1 text-[#2C241D] leading-relaxed">
                  {renderInlineFormatted(itemText)}
                </span>
              </div>
            );
          }

          // Normal paragraph
          return (
            <p key={idx} className="text-xs sm:text-sm text-[#2C241D] leading-relaxed">
              {renderInlineFormatted(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  const cleanInlineSymbols = (str: string) => {
    return str.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`([^`]+)`/g, '$1');
  };

  // Convert **bold** into nice strong text without raw asterisks
  const renderInlineFormatted = (str: string) => {
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={`b_${match.index}`} className="font-bold text-[#1C1610]">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts;
  };

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Context & Control Header */}
      <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[#E5E0D4] bg-[#F5F2EA] shrink-0">
              <img
                src="/src/assets/images/avatar_skillora_tutor_1791512292426.jpg"
                alt="Skillora AI Tutor"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#2C241D]">Skillora AI Tutor</h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                {hasResumedChat && (
                  <span className="text-[10px] font-bold text-[#55634E] bg-[#E9E4D6] px-2 py-0.5 rounded-full">
                    Resumed from previous session
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7A7165]">
                Multimodal learning: ask questions, attach diagrams or files, explore analogies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Topic Selector */}
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold rounded-2xl border border-[#D5CFBF] bg-[#FAF8F5] text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E] max-w-[200px] truncate cursor-pointer"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {/* New Chat / Reset Button */}
            <button
              onClick={handleClearHistory}
              className="p-2 text-[#7A7165] hover:text-[#2C241D] bg-[#F5F2EA] hover:bg-[#EBE5D8] rounded-2xl transition-colors cursor-pointer"
              title="Start a new chat session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tutor Modes */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#F0EBE0]">
          <span className="text-xs font-bold text-[#7A7165] shrink-0 mr-1">Style:</span>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                mode === m.id
                  ? 'bg-[#55634E] text-white shadow-2xs'
                  : 'bg-[#F5F2EA] text-[#6B6256] hover:bg-[#EBE5D8] hover:text-[#2C241D]'
              }`}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="bg-white rounded-3xl border border-[#E8E2D5] shadow-xs flex flex-col h-[540px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-2xl overflow-hidden border border-[#E5E0D4] shrink-0 mt-0.5">
                    <img
                      src="/src/assets/images/avatar_skillora_tutor_1791512292426.jpg"
                      alt="Tutor"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className={`max-w-2xl space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Attached media display in message */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1 justify-end">
                      {msg.attachments.map((att, attIdx) => {
                        const isImg = att.type?.startsWith('image/');
                        return (
                          <div
                            key={attIdx}
                            className="p-1.5 bg-[#F5F2EA] border border-[#DCD5C5] rounded-xl flex items-center gap-2 text-xs"
                          >
                            {isImg ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="w-12 h-12 object-cover rounded-lg border border-[#D5CFBF]"
                              />
                            ) : (
                              <FileText className="w-4 h-4 text-[#55634E]" />
                            )}
                            <div className="max-w-[140px] truncate text-[11px] font-semibold text-[#2C241D]">
                              {att.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-3xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#382B21] text-white rounded-tr-xs shadow-2xs whitespace-pre-wrap'
                        : 'bg-[#FAF8F4] text-[#2C241D] border border-[#E8E2D5] rounded-tl-xs'
                    }`}
                  >
                    {isUser ? msg.text : renderCleanMessageText(msg.text, msg.id)}
                  </div>

                  <div className="flex items-center gap-3 px-1 text-[11px] text-[#8A8174]">
                    <span>{msg.timestamp}</span>
                    {msg.engineUsed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-[#6B6256]">
                          <Cpu className="w-3 h-3 text-[#55634E]" />
                          {msg.engineUsed}
                        </span>
                      </>
                    )}
                    {!isUser && (
                      <>
                        <span aria-hidden="true">·</span>
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg.text)}
                          className="hover:text-[#2C241D] flex items-center gap-1 cursor-pointer font-semibold"
                          title="Listen with Text-to-Speech"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3 h-3 text-[#55634E]" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Read Aloud</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-[#EBE5D8] text-[#554A3B] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-[#7A7165] text-xs">
              <div className="w-8 h-8 rounded-2xl overflow-hidden border border-[#E5E0D4] shrink-0">
                <img
                  src="/src/assets/images/avatar_skillora_tutor_1791512292426.jpg"
                  alt="Tutor"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-[#FAF8F4] rounded-2xl border border-[#E8E2D5]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#55634E]" />
                <span>
                  {attachments.length > 0
                    ? 'Searching and analyzing attached files...'
                    : `Generating explanation for ${selectedTopic?.title || 'concept'}...`}
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-6 py-2 border-t border-[#F0EBE0] flex items-center gap-2 overflow-x-auto bg-[#FAF8F4]/80">
          <span className="text-[11px] font-bold text-[#8A8174] shrink-0">Prompts:</span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-[11px] font-semibold text-[#554A3B] hover:text-[#2C241D] bg-white border border-[#E0D9CB] hover:border-[#55634E] px-3 py-1 rounded-full whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 bg-[#F6F2E9] border-t border-[#E8E2D5] flex items-center gap-2 overflow-x-auto">
            {attachments.map((att, idx) => {
              const isImg = att.type?.startsWith('image/');
              return (
                <div
                  key={idx}
                  className="p-1.5 bg-white border border-[#D5CFBF] rounded-xl flex items-center gap-2 text-xs shrink-0"
                >
                  {isImg ? (
                    <img src={att.dataUrl} alt={att.name} className="w-8 h-8 object-cover rounded-md" />
                  ) : (
                    <FileText className="w-4 h-4 text-[#55634E]" />
                  )}
                  <span className="max-w-[120px] truncate text-[11px] font-medium text-[#2C241D]">
                    {att.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-0.5 text-[#8A8174] hover:text-red-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,text/*,.py,.js,.ts,.tsx,.json,.md,.csv"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Input Bar */}
        <div className="p-4 border-t border-[#E8E2D5] bg-white rounded-b-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-[#FAF8F5] hover:bg-[#EBE5D8] border border-[#D5CFBF] text-[#554A3B] rounded-2xl transition-colors cursor-pointer"
              title="Attach images, diagrams, or files for search & QA"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                attachments.length > 0
                  ? 'Ask a question or search in attached file(s)...'
                  : `Ask a question about ${selectedTopic?.title || 'this topic'}...`
              }
              disabled={loading}
              className="flex-1 px-4 py-3 text-sm rounded-2xl border border-[#D5CFBF] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#55634E] disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={loading || (!inputMessage.trim() && attachments.length === 0)}
              className="px-5 py-3 bg-[#55634E] hover:bg-[#47533F] text-white rounded-2xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
