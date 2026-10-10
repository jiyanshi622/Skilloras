import React, { useState, useEffect } from 'react';
import {
  Calendar, Check, Circle, Play,
  Pause, RotateCcw, RefreshCw, Plus,
  Trash2, Clock, BookOpen, Layers,
  X, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { TimetableSlot, Topic, Subject } from '../types/index.ts';

interface TimetableViewProps {
  onNavigateToPractice: (topicId: string) => void;
}

const DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export const TimetableView: React.FC<TimetableViewProps> = ({ onNavigateToPractice }) => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(
    DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  );
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  // Personalization Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDay, setTaskDay] = useState<string>(selectedDay);
  const [taskDate, setTaskDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [taskDuration, setTaskDuration] = useState<number>(45);
  const [taskTimeSlot, setTaskTimeSlot] = useState<string>('10:00 - 10:45');
  const [taskActivityType, setTaskActivityType] = useState<string>('concept_study');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [savingSlot, setSavingSlot] = useState(false);

  // Pomodoro Focus Timer State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'study' | 'break'>('study');

  useEffect(() => {
    async function loadData() {
      try {
        const [tt, tops, subs] = await Promise.all([
          api.getTimetable(),
          api.getTopics(),
          api.getSubjects()
        ]);
        setTimetable(tt);
        setTopics(tops);
        setSubjects(subs);
      } catch (err) {
        console.error('Failed to load timetable data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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

  const handleDeleteSlot = async (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteTimetableSlot(slotId);
      setTimetable(prev => prev.filter(s => s.id !== slotId));
    } catch (err) {
      console.error('Failed to delete slot:', err);
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

  const handleCreateCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setSavingSlot(true);
    try {
      const selectedTopic = topics.find(t => t.id === selectedTopicId);
      const newSlot = await api.addTimetableSlot({
        topicTitle: taskTitle.trim(),
        dayOfWeek: taskDay,
        date: taskDate || undefined,
        durationMinutes: taskDuration,
        timeSlot: taskTimeSlot.trim() || `${taskDuration} mins`,
        activityType: taskActivityType,
        topicId: selectedTopicId || undefined,
        subjectId: selectedTopic?.subjectId || undefined
      });

      setTimetable(prev => [newSlot, ...prev]);
      setSelectedDay(taskDay);
      setIsModalOpen(false);
      setTaskTitle('');
    } catch (err: any) {
      alert(err.message || 'Failed to add timetable task');
    } finally {
      setSavingSlot(false);
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
        <RefreshCw className="w-8 h-8 text-[#55634E] animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-[#2C241D]">Organizing Study Timetable...</h2>
        <p className="text-xs text-[#7A7165]">Aligning daily focus blocks with spaced repetition intervals.</p>
      </div>
    );
  }

  const filteredSlots = timetable.filter(s => s.dayOfWeek === selectedDay);
  const completedCount = filteredSlots.filter(s => s.isCompleted).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4D5A46] bg-[#E9E4D6] px-3.5 py-1.5 rounded-full w-fit">
            <Calendar className="w-3.5 h-3.5 text-[#55634E]" />
            <span>Spaced Repetition Scheduler & Timetable</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C241D] tracking-tight">
            Personalized Daily Study Timetable
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6256] font-medium">
            Customize your schedule: select tasks, day of the week, target date, and session duration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setTaskDay(selectedDay);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Personalize / Add Task</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-5 py-2.5 text-xs font-bold text-[#382B21] bg-white border border-[#E5E0D4] hover:bg-[#FAF8F5] rounded-full shadow-2xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#55634E] ${regenerating ? 'animate-spin' : ''}`} />
            <span>Auto-Fill with AI</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: 7-Day Timetable Organizers */}
        <div className="lg:col-span-8 space-y-6">
          {/* Day of Week Selector */}
          <div className="bg-white rounded-3xl border border-[#E8E2D5] p-2.5 shadow-xs">
            <div className="flex items-center justify-between gap-1 overflow-x-auto">
              {DAYS.map((day) => {
                const daySlots = timetable.filter(s => s.dayOfWeek === day);
                const dayDone = daySlots.filter(s => s.isCompleted).length;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex-1 min-w-[90px] py-3 px-3 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#55634E] text-white shadow-2xs'
                        : 'hover:bg-[#F6F3EC] text-[#6B6256]'
                    }`}
                  >
                    <div>{day.slice(0, 3)}</div>
                    <div className={`text-[10px] mt-0.5 font-normal ${isSelected ? 'text-[#DDE5D9]' : 'text-[#8A8174]'}`}>
                      {dayDone}/{daySlots.length} done
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots List for Selected Day */}
          <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2C241D]">
                  {selectedDay} Schedule
                </h2>
                <span className="text-xs text-[#7A7165]">({filteredSlots.length} slots)</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#7A7165]">
                {completedCount} of {filteredSlots.length} completed
              </span>
            </div>

            <div className="space-y-3">
              {filteredSlots.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7A7165] border border-dashed border-[#E8E2D5] rounded-3xl space-y-3">
                  <p>No study slots scheduled for {selectedDay}.</p>
                  <button
                    onClick={() => {
                      setTaskDay(selectedDay);
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-bold text-[#55634E] bg-[#EBE5D8] hover:bg-[#DCD5C5] rounded-full inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task for {selectedDay}</span>
                  </button>
                </div>
              ) : (
                filteredSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group ${
                      slot.isCompleted
                        ? 'border-[#55634E]/30 bg-[#EBE5D8]/40'
                        : 'border-[#E8E2D5] bg-white hover:border-[#D5CFBE]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSlot(slot.id, slot.isCompleted)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          slot.isCompleted
                            ? 'bg-[#55634E] text-white border border-[#55634E]'
                            : 'border-2 border-[#C5BDAF] hover:border-[#55634E]'
                        }`}
                        title={slot.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                      >
                        {slot.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-[#2C241D]">
                            {slot.timeSlot}
                          </span>
                          <span aria-hidden="true" className="text-[#D0C8B8]">·</span>
                          <span className="text-[10px] font-bold text-[#55634E] bg-[#E9E4D6] px-2 py-0.5 rounded-full">
                            {slot.durationMinutes || 45} mins
                          </span>
                          {slot.date && (
                            <>
                              <span aria-hidden="true" className="text-[#D0C8B8]">·</span>
                              <span className="text-[10px] font-mono text-[#7A7165] bg-[#F5F2EA] px-2 py-0.5 rounded-full">
                                {slot.date}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true" className="text-[#D0C8B8]">·</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            slot.activityType === 'revision'
                              ? 'bg-amber-100 text-amber-900'
                              : slot.activityType === 'practice_drill'
                              ? 'bg-[#E9E4D6] text-[#4D5A46]'
                              : slot.activityType === 'quiz_evaluation'
                              ? 'bg-[#FAECE6] text-[#934720]'
                              : 'bg-[#F0ECE1] text-[#6B6256]'
                          }`}>
                            {slot.activityType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className={`text-sm font-bold truncate mt-1 ${
                          slot.isCompleted ? 'text-[#968E82] line-through' : 'text-[#2C241D]'
                        }`}>
                          {slot.topicTitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {slot.topicId && (
                        <button
                          onClick={() => onNavigateToPractice(slot.topicId!)}
                          className="px-3.5 py-1.5 text-xs font-bold text-[#382B21] bg-[#F5F2EA] hover:bg-[#EBE5D8] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Start Drill
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDeleteSlot(slot.id, e)}
                        className="p-2 text-[#C5BDAF] hover:text-red-700 opacity-60 hover:opacity-100 transition-colors cursor-pointer"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Integrated Pomodoro Focus Study Timer */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E2D5] p-7 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#55634E]">
              Deliberate Focus Timer
            </span>
            <h3 className="text-lg font-bold text-[#2C241D]">
              {pomodoroMode === 'study' ? 'Deep Study Interval' : 'Rest Break'}
            </h3>
            <p className="text-xs text-[#7A7165]">
              25 minutes of undistracted deliberate practice followed by 5 minutes of cognitive rest.
            </p>
          </div>

          <div className="py-8 bg-[#382B21] text-white rounded-3xl text-center space-y-2">
            <div className="text-5xl font-mono font-bold tracking-tight text-white tabular-nums">
              {formatTimer(pomodoroSeconds)}
            </div>
            <div className="text-[11px] text-[#C6BBAA] uppercase tracking-widest font-semibold">
              {pomodoroActive ? 'Session in progress' : 'Paused / Ready'}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPomodoroActive(!pomodoroActive)}
              className={`px-6 py-2.5 rounded-full font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                pomodoroActive
                  ? 'bg-amber-700 hover:bg-amber-800 text-white'
                  : 'bg-[#55634E] hover:bg-[#47533F] text-white shadow-xs'
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
              className="p-2.5 text-[#6B6256] hover:text-[#2C241D] bg-[#F5F2EA] hover:bg-[#EBE5D8] rounded-full transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-4 border-t border-[#F0EBE0] text-xs text-[#7A7165] space-y-2">
            <div className="font-bold text-[#2C241D]">Personalization Tip:</div>
            <p className="leading-relaxed">
              Tailor each study block by selecting specific topics, day of the week, target date, and exact duration in minutes.
            </p>
          </div>
        </div>
      </div>

      {/* Personalize Timetable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E8E2D5] max-w-lg w-full p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EBE5D8] text-[#55634E] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#2C241D] text-base">Personalize Timetable Task</h3>
                  <p className="text-[11px] text-[#7A7165]">Configure task, day, date & duration</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#7A7165] hover:text-[#2C241D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTask} className="space-y-4 text-xs">
              {/* Task Title */}
              <div>
                <label className="block font-bold text-[#2C241D] mb-1.5 uppercase tracking-wider">
                  Task or Topic Name *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Dynamic Programming Memoization Drill"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-xs text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
                />
              </div>

              {/* Or Select from curriculum topics */}
              <div>
                <label className="block font-bold text-[#2C241D] mb-1.5 uppercase tracking-wider">
                  Link to Curriculum Topic (Optional)
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => {
                    setSelectedTopicId(e.target.value);
                    const t = topics.find(item => item.id === e.target.value);
                    if (t && !taskTitle) setTaskTitle(t.title);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-xs text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E] cursor-pointer"
                >
                  <option value="">-- Choose a Curriculum Topic --</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day of Week & Specific Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C241D] mb-1.5 uppercase tracking-wider">
                    Day of the Week *
                  </label>
                  <select
                    value={taskDay}
                    onChange={(e) => setTaskDay(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-xs text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E] cursor-pointer"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2C241D] mb-1.5 uppercase tracking-wider">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-xs text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E] cursor-pointer"
                  />
                </div>
              </div>

              {/* Duration & Time Slot */}
              <div className="space-y-2">
                <label className="block font-bold text-[#2C241D] uppercase tracking-wider">
                  Session Duration *
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {DURATIONS.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => {
                        setTaskDuration(dur);
                        setTaskTimeSlot(`Focus: ${dur} mins`);
                      }}
                      className={`py-2 px-1 text-center font-bold rounded-xl border transition-all cursor-pointer ${
                        taskDuration === dur
                          ? 'bg-[#55634E] text-white border-[#55634E] shadow-2xs'
                          : 'bg-white border-[#E8E2D5] text-[#2C241D] hover:border-[#D5CFBE]'
                      }`}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2C241D] mb-1.5 uppercase tracking-wider">
                    Time Window / Slot
                  </label>
                  <input
                    type="text"
                    value={taskTimeSlot}
                    onChange={(e) => setTaskTimeSlot(e.target.value)}
                    placeholder="e.g. 14:00 - 14:45"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-xs text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2C241D] mb-1.5 uppercase tracking-wider">
                    Activity Type
                  </label>
                  <select
                    value={taskActivityType}
                    onChange={(e) => setTaskActivityType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F5] text-xs text-[#2C241D] focus:outline-none focus:ring-2 focus:ring-[#55634E] cursor-pointer"
                  >
                    <option value="concept_study">Concept Study</option>
                    <option value="practice_drill">Practice Drill</option>
                    <option value="revision">Targeted Revision</option>
                    <option value="quiz_evaluation">Quiz Prep</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#F0EBE0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-[#7A7165] hover:text-[#2C241D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlot}
                  className="px-6 py-2.5 font-bold text-white bg-[#55634E] hover:bg-[#47533F] rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingSlot ? 'Adding Task...' : 'Save to Timetable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
