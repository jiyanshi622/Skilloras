import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle2, Circle, Clock, Play,
  Pause, RotateCcw, Sparkles, RefreshCw, ChevronRight,
  Flame, BookOpen, BrainCircuit
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { TimetableSlot } from '../types/index.ts';

interface TimetableViewProps {
  onNavigateToPractice: (topicId: string) => void;
}

const DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const TimetableView: React.FC<TimetableViewProps> = ({ onNavigateToPractice }) => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(
    DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  );
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  // Pomodoro Focus Timer State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'study' | 'break'>('study');

  useEffect(() => {
    async function loadTimetable() {
      try {
        const data = await api.getTimetable();
        setTimetable(data);
      } catch (err) {
        console.error('Failed to load timetable:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTimetable();
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (pomodoroActive && pomodoroSeconds > 0) {
      interval = setInterval(() => {
        setPomodoroSeconds(s => s - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0) {
      setPomodoroActive(false);
      if (pomodoroMode === 'study') {
        setPomodoroMode('break');
        setPomodoroSeconds(5 * 60);
      } else {
        setPomodoroMode('study');
        setPomodoroSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroSeconds, pomodoroMode]);

  const handleToggleSlot = async (slotId: string, currentStatus: boolean) => {
    try {
      await api.toggleTimetableSlot(slotId, !currentStatus);
      setTimetable(prev => prev.map(s => s.id === slotId ? { ...s, isCompleted: !currentStatus } : s));
    } catch (err) {
      console.error('Failed to toggle slot:', err);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const updated = await api.regenerateTimetable();
      setTimetable(updated);
    } catch (err) {
      console.error('Failed to regenerate timetable:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Organizing Study Timetable...</h2>
        <p className="text-xs text-slate-500">Aligning daily focus blocks with spaced repetition intervals.</p>
      </div>
    );
  }

  const filteredSlots = timetable.filter(s => s.dayOfWeek === selectedDay);
  const completedCount = filteredSlots.filter(s => s.isCompleted).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md w-fit">
            <Calendar className="w-3.5 h-3.5" />
            <span>Spaced Repetition Scheduler</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Personalized Daily Study Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Automated 45-minute focus blocks calibrated to your daily hours and retention vulnerabilities.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${regenerating ? 'animate-spin' : ''}`} />
          <span>Regenerate with AI Engine</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: 7-Day Timetable Organizers */}
        <div className="lg:col-span-8 space-y-6">
          {/* Day of Week Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
            <div className="flex items-center justify-between gap-1 overflow-x-auto">
              {DAYS.map((day) => {
                const daySlots = timetable.filter(s => s.dayOfWeek === day);
                const dayDone = daySlots.filter(s => s.isCompleted).length;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>{day.slice(0, 3)}</div>
                    <div className={`text-[10px] mt-0.5 font-normal ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {dayDone}/{daySlots.length} done
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots List for Selected Day */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {selectedDay} Focus Schedule
              </h2>
              <span className="text-xs font-mono font-semibold text-slate-500">
                {completedCount} of {filteredSlots.length} completed
              </span>
            </div>

            <div className="space-y-3">
              {filteredSlots.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  No study slots scheduled for {selectedDay}. Click "Regenerate with AI Engine" to rebuild.
                </div>
              ) : (
                filteredSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      slot.isCompleted
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSlot(slot.id, slot.isCompleted)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                        title={slot.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                      >
                        {slot.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-slate-600">
                            {slot.timeSlot}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            slot.activityType === 'revision'
                              ? 'bg-amber-100 text-amber-800'
                              : slot.activityType === 'practice_drill'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {slot.activityType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className={`text-sm font-semibold truncate mt-1 ${
                          slot.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}>
                          {slot.topicTitle}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToPractice(slot.topicId)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Start Drill
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Integrated Pomodoro Focus Study Timer */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Deliberate Focus Timer
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {pomodoroMode === 'study' ? 'Deep Study Interval' : 'Rest Break'}
            </h3>
            <p className="text-xs text-slate-500">
              25 minutes of undistracted deliberate practice followed by 5 minutes of cognitive rest.
            </p>
          </div>

          <div className="py-8 bg-slate-900 text-white rounded-2xl text-center space-y-2">
            <div className="text-5xl font-mono font-bold tracking-tight text-white tabular-nums">
              {formatTimer(pomodoroSeconds)}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              {pomodoroActive ? 'Session in progress' : 'Paused / Ready'}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPomodoroActive(!pomodoroActive)}
              className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                pomodoroActive
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              {pomodoroActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{pomodoroActive ? 'Pause Focus' : 'Start Focus'}</span>
            </button>

            <button
              onClick={() => {
                setPomodoroActive(false);
                setPomodoroSeconds(pomodoroMode === 'study' ? 25 * 60 : 5 * 60);
              }}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <div className="font-semibold text-slate-800">Spaced Repetition Tip:</div>
            <p className="leading-relaxed">
              Completing scheduled timetable slots updates your learning streak and triggers adaptive re-indexing of upcoming practice questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
