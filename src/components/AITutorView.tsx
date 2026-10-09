import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Bot, User as UserIcon, Sparkles, Volume2,
  VolumeX, RefreshCw, HelpCircle, BookOpen, Brain,
  ChevronDown, Cpu, CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { Topic, ChatMessage } from '../types/index.ts';

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
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // Initial welcome message from tutor
    const currentTopic = topics.find(t => t.id === selectedTopicId);
    const topicTitle = currentTopic ? currentTopic.title : 'General Computer Science & STEM';

    setMessages([
      {
        id: 'msg_initial',
        sender: 'assistant',
        text: `Hello! I am your Skillora AI Tutor. We are currently focusing on **${topicTitle}**.\n\nAsk me anything: request an intuitive analogy (ELI5), ask for a line-by-line derivation, or get an active-recall drill!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: 'Skillora Neural Assistant'
      }
    ]);
  }, [selectedTopicId, topics]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const res = await api.askAITutor({
        topicId: selectedTopicId,
        userQuery: text.trim(),
        mode: mode as any,
        chatHistory: historyPayload
      });

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: res.engine
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant_err_${Date.now()}`,
        sender: 'assistant',
        text: "I couldn't reach the model endpoint right now. You can continue reading the verified materials or switch to the deterministic Knowledge Engine in Settings.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: 'Fallback Engine'
      };
      setMessages(prev => [...prev, errorMsg]);
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
        // Strip markdown asterisks and backticks for clean speech
        const clean = text.replace(/[*_#`]/g, '');
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.05;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  const selectedTopic = topics.find(t => t.id === selectedTopicId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Context & Control Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <img
                src="/src/assets/images/avatar_skillora_tutor_1791512292426.jpg"
                alt="Skillora AI Tutor"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Skillora Adaptive AI Tutor
              </h1>
              <p className="text-xs text-slate-500">
                Context-aware dialog calibrated to your Bayesian mastery profile.
              </p>
            </div>
          </div>

          {/* Topic Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 shrink-0">
              Topic Context:
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[240px] truncate"
            >
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pedagogical Explanation Modes */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
          <span className="text-xs text-slate-400 shrink-0 font-medium">Mode:</span>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                mode === m.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0 mt-0.5">
                    <img
                      src="/src/assets/images/avatar_skillora_tutor_1791512292426.jpg"
                      alt="Tutor"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className={`max-w-2xl space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>

                  <div className="flex items-center gap-3 px-1 text-[11px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.engineUsed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                          <Cpu className="w-3 h-3 text-indigo-500" />
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
                          className="hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                          title="Listen with Text-to-Speech"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3 h-3 text-indigo-600" />
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
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-slate-500 text-xs">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <img
                  src="/src/assets/images/avatar_skillora_tutor_1791512292426.jpg"
                  alt="Tutor"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Generating explanation for {selectedTopic?.title || 'topic'}...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/50">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Prompts:</span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-[11px] font-medium text-slate-600 hover:text-indigo-700 bg-white border border-slate-200 hover:border-indigo-300 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask a question about ${selectedTopic?.title || 'this topic'}...`}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
