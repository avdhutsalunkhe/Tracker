import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTimer } from '../context/TimerContext';
import { useToast } from '../context/ToastContext';
import { TimetableBlock, TimetableCategory, TimetableDayType } from '../types';
import {
  detectFreeWindows,
  hasTimeOverlap,
  isBlockActiveOnDate,
  timeToMinutes,
} from '../utils/scheduleAllocator';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  CalendarClock,
  Plus,
  Sparkles,
  Play,
  Lock,
  Unlock,
  Check,
  Trash2,
  Edit2,
  Clock,
  Target,
} from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedDate,
    timetableBlocks,
    allottedSlots,
    subjects,
    addTimetableBlock,
    updateTimetableBlock,
    deleteTimetableBlock,
    loadSampleRoutine,
    autoPlanDay,
    toggleSlotLock,
    toggleSlotCompleted,
    deleteAllottedSlot,
    updateSettings,
  } = useData();
  const { setSelectedSubjectId, setSelectedTopicId, startTimer } = useTimer();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimetableBlock | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<TimetableBlock | null>(null);

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [dayType, setDayType] = useState<TimetableDayType>('All Days');
  const [category, setCategory] = useState<TimetableCategory>('Fixed');

  // Live current time in minutes for the timeline indicator
  const [nowMins, setNowMins] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMins(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  const activeBlocks = useMemo(
    () =>
      timetableBlocks
        .filter((b) => isBlockActiveOnDate(b, selectedDate))
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [timetableBlocks, selectedDate]
  );

  const daySlots = useMemo(
    () =>
      allottedSlots
        .filter((s) => s.slot_date === selectedDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [allottedSlots, selectedDate]
  );

  const freeWindows = useMemo(
    () => detectFreeWindows(timetableBlocks, selectedDate),
    [timetableBlocks, selectedDate]
  );

  const totalFreeHours = useMemo(() => {
    const mins = freeWindows.reduce((acc, w) => acc + w.durationMinutes, 0);
    return Math.round((mins / 60) * 10) / 10;
  }, [freeWindows]);

  // Unified sorted timeline items
  const timelineItems = useMemo(() => {
    type TimelineItem =
      | { kind: 'fixed'; start: string; end: string; block: TimetableBlock }
      | { kind: 'study'; start: string; end: string; slot: (typeof daySlots)[0] };

    const list: TimelineItem[] = [
      ...activeBlocks.map((b) => ({
        kind: 'fixed' as const,
        start: b.start_time,
        end: b.end_time,
        block: b,
      })),
      ...daySlots.map((s) => ({
        kind: 'study' as const,
        start: s.start_time,
        end: s.end_time,
        slot: s,
      })),
    ];
    return list.sort((a, b) => a.start.localeCompare(b.start));
  }, [activeBlocks, daySlots]);

  const openAddModal = () => {
    setEditingBlock(null);
    setTitle('');
    setStartTime('09:00');
    setEndTime('12:00');
    setDayType('All Days');
    setCategory('Fixed');
    setIsModalOpen(true);
  };

  const openEditModal = (block: TimetableBlock) => {
    setEditingBlock(block);
    setTitle(block.title);
    setStartTime(block.start_time);
    setEndTime(block.end_time);
    setDayType(block.day_type);
    setCategory(block.category);
    setIsModalOpen(true);
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      showToast({
        type: 'error',
        title: 'Invalid Time Range',
        message: 'End time must be after start time.',
      });
      return;
    }

    const overlap = hasTimeOverlap(
      timetableBlocks,
      startTime,
      endTime,
      dayType,
      editingBlock?.id
    );
    if (overlap) {
      showToast({
        type: 'error',
        title: 'Time Overlap Detected',
        message: `Overlaps with "${overlap.title}" (${overlap.start_time}–${overlap.end_time}).`,
      });
      return;
    }

    if (editingBlock) {
      await updateTimetableBlock(editingBlock.id, {
        title: title.trim(),
        start_time: startTime,
        end_time: endTime,
        day_type: dayType,
        category,
      });
    } else {
      await addTimetableBlock({
        title: title.trim(),
        start_time: startTime,
        end_time: endTime,
        day_type: dayType,
        category,
      });
    }
    setIsModalOpen(false);
  };

  const handleStartSlotTimer = (slot: (typeof daySlots)[0]) => {
    setSelectedSubjectId(slot.subject_id || null);
    setSelectedTopicId(slot.topic_id || null);
    startTimer();
    navigate('/timer');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Daily Timetable & Auto Study Allocator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define fixed commitments and auto-fill free windows with prioritized GATE study blocks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkCard text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fixed Block</span>
          </button>

          <button
            type="button"
            onClick={() => autoPlanDay(selectedDate)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Plan My Day</span>
          </button>
        </div>
      </div>

      {/* Free Windows & Goal Sync Banner */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Clock className="w-4 h-4" />
            <span className="tabular-nums">
              {freeWindows.length} Free Windows Detected ({totalFreeHours}h available on {selectedDate})
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {freeWindows.map((w, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums"
              >
                {w.startTime}–{w.endTime} ({w.durationMinutes}m)
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {timetableBlocks.length === 0 && (
            <button
              type="button"
              onClick={loadSampleRoutine}
              className="px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              Load Sample Routine
            </button>
          )}
          <button
            type="button"
            onClick={() => updateSettings({ daily_study_goal_hours: Math.min(16, Math.max(1, totalFreeHours)) })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 tabular-nums"
          >
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sync {totalFreeHours}h as Study Goal</span>
          </button>
        </div>
      </div>

      {/* Vertical Daily Timeline */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Visual Timeline ({selectedDate})
          </h2>
          <span className="text-[11px] text-slate-400 tabular-nums">
            Now: {String(Math.floor(nowMins / 60)).padStart(2, '0')}:{String(nowMins % 60).padStart(2, '0')}
          </span>
        </div>

        {timelineItems.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 space-y-3">
            <p>No fixed blocks or study slots scheduled yet.</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={loadSampleRoutine}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Load Sample Routine
              </button>
              <button
                type="button"
                onClick={() => autoPlanDay(selectedDate)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Auto-Plan My Day
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {timelineItems.map((item) => {
              const startM = timeToMinutes(item.start);
              const endM = timeToMinutes(item.end);
              const isCurrent = nowMins >= startM && nowMins < endM;

              if (item.kind === 'fixed') {
                const b = item.block;
                return (
                  <div
                    key={`fixed-${b.id}`}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                        {b.start_time} – {b.end_time}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {b.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {b.category} · {b.day_type}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Edit Block"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlockToDelete(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                        title="Delete Block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              const s = item.slot;
              const subj = s.subject_id ? subjectMap.get(s.subject_id) : null;

              return (
                <div
                  key={`slot-${s.id}`}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    s.completed
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30 opacity-85'
                      : isCurrent
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-white dark:bg-darkCard border-indigo-200/70 dark:border-indigo-900/50'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleSlotCompleted(s.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-colors ${
                        s.completed
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-indigo-300 dark:border-indigo-600 hover:border-indigo-500'
                      }`}
                      title="Mark slot completed"
                    >
                      {s.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
                      {s.start_time} – {s.end_time}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            s.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {s.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {s.slot_type}
                        </span>
                        {subj && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${subj.color}18`, color: subj.color }}
                          >
                            {subj.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSlotLock(s.id)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        s.is_locked
                          ? 'border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700'
                      }`}
                      title={s.is_locked ? 'Unlock slot (allows re-plan)' : 'Lock slot'}
                    >
                      {s.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartSlotTimer(s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold shadow-2xs"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Timer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteAllottedSlot(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                      title="Remove slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Fixed Block Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBlock ? 'Edit Fixed Block' : 'Add Fixed Routine Block'}
        subtitle="Fixed commitments (college, work, meals, sleep) are preserved when auto-planning."
      >
        <form onSubmit={handleSaveBlock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Block Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. College Lectures, Lunch Break, Gym"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Day Type
              </label>
              <select
                value={dayType}
                onChange={(e) => setDayType(e.target.value as TimetableDayType)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
              >
                <option value="All Days">All Days</option>
                <option value="Weekdays">Weekdays</option>
                <option value="Weekends">Weekends</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TimetableCategory)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
              >
                <option value="Fixed">Fixed</option>
                <option value="Rest">Rest</option>
                <option value="Commute">Commute</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
            >
              {editingBlock ? 'Save Changes' : 'Add Block'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(blockToDelete)}
        onClose={() => setBlockToDelete(null)}
        onConfirm={() => {
          if (blockToDelete) return deleteTimetableBlock(blockToDelete.id);
        }}
        title="Delete Routine Block"
        message={`Delete "${blockToDelete?.title}" (${blockToDelete?.start_time}–${blockToDelete?.end_time})?`}
        confirmLabel="Delete Block"
      />
    </div>
  );
};
