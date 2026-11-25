import React, { useState } from 'react';
import { useTimer } from '../../context/TimerContext';
import { useData } from '../../context/DataContext';
import { soundscape, SoundscapeType } from '../../lib/soundscape';
import { Timer, Clock, Volume2 } from 'lucide-react';

export const ModeSelector: React.FC = () => {
  const {
    mode,
    setMode,
    phase,
    setPhase,
    isRunning,
    focusMinutes,
    setFocusMinutes,
    breakMinutes,
    setBreakMinutes,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedTopicId,
    setSelectedTopicId,
  } = useTimer();

  const { subjects, topics } = useData();

  const [noiseType, setNoiseType] = useState<SoundscapeType>(() => soundscape.getType());
  const [noiseVolume, setNoiseVolume] = useState(0.25);

  // Presets: [focus, break]
  const presets = [
    { label: '25 / 5', focus: 25, breakMins: 5 },
    { label: '50 / 10', focus: 50, breakMins: 10 },
    { label: '90 / 15', focus: 90, breakMins: 15 },
    { label: '180m Exam', focus: 180, breakMins: 10 },
  ];

  const filteredTopics = selectedSubjectId
    ? topics.filter((t) => t.subject_id === selectedSubjectId)
    : topics;

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      {/* Mode Toggle: Pomodoro vs Stopwatch */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Study Mode
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setMode('Pomodoro')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${mode === 'Pomodoro'
              ? 'bg-white dark:bg-darkCard text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              } disabled:opacity-60`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pomodoro Interval</span>
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={() => setMode('Stopwatch')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${mode === 'Stopwatch'
              ? 'bg-white dark:bg-darkCard text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              } disabled:opacity-60`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Deep Stopwatch</span>
          </button>
        </div>
      </div>

      {/* Pomodoro Presets (Only shown in Pomodoro mode) */}
      {mode === 'Pomodoro' && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Duration Presets (Focus / Break)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((p) => {
              const isSelected = focusMinutes === p.focus && breakMinutes === p.breakMins;
              return (
                <button
                  type="button"
                  key={p.label}
                  disabled={isRunning}
                  onClick={() => {
                    setFocusMinutes(p.focus);
                    setBreakMinutes(p.breakMins);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${isSelected
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    } disabled:opacity-60`}
                >
                  {p.label} mins
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subject & Topic Linking */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Link GATE Subject (Optional)
          </label>
          <select
            value={selectedSubjectId || ''}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value || null);
              setSelectedTopicId(null);
            }}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">General Study / No Specific Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSubjectId && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Link Syllabus Topic (Optional)
            </label>
            <select
              value={selectedTopicId || ''}
              onChange={(e) => setSelectedTopicId(e.target.value || null)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">General Subject Revision</option>
              {filteredTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.topic_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Offline Focus Soundscape */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
            Offline Focus Soundscape
          </label>
          {noiseType !== 'off' && (
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={noiseVolume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setNoiseVolume(v);
                soundscape.setVolume(v);
              }}
              className="w-24 accent-indigo-600"
              aria-label="Soundscape volume"
            />
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { id: 'off', label: 'Off' },
            { id: 'brown', label: 'Brown' },
            { id: 'rain', label: 'Rain' },
            { id: 'white', label: 'White' },
          ] as const).map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setNoiseType(n.id);
                soundscape.start(n.id, noiseVolume);
              }}
              className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-colors ${
                noiseType === n.id
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

