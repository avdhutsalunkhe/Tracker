import React from 'react';
import { useData } from '../../context/DataContext';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { Flame, Clock, Calendar, ArrowRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GateCountdownProps {
  compact?: boolean;
}

export const GateCountdown: React.FC<GateCountdownProps> = ({ compact = false }) => {
  const { settings, selectedDateStudyHours, activeStreak } = useData();

  const examDate = settings?.gate_exam_date || '2027-02-06';
  const goalHours = settings?.daily_study_goal_hours || 6.0;

  // Calculate days left
  let daysRemaining = 0;
  try {
    const today = new Date();
    const target = parseISO(examDate);
    daysRemaining = differenceInCalendarDays(target, today);
    if (daysRemaining < 0) daysRemaining = 0;
  } catch {
    daysRemaining = 0;
  }

  const studyPercent = Math.min(100, Math.round((selectedDateStudyHours / goalHours) * 100));

  if (compact) {
    return (
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900/90 border border-indigo-500/30 text-white shadow-md">
        <div className="flex items-center justify-between text-xs text-indigo-300 font-medium mb-1.5">
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            GATE Countdown
          </span>
          <span className="font-bold text-white tracking-wide">{daysRemaining} Days</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Study Goal</span>
            <span className="font-semibold text-indigo-200">
              {selectedDateStudyHours}h / {goalHours}h ({studyPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${studyPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-5 sm:p-6 border border-indigo-500/30 shadow-xl">
      {/* Decorative ambient background blur */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Days Remaining & Exam Info */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 shrink-0 text-center min-w-[76px]">
            <span className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-emerald-300 leading-none">
              {daysRemaining}
            </span>
            <span className="block text-[10px] font-semibold text-indigo-300 uppercase tracking-wider mt-0.5">
              Days Left
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <Calendar className="w-3 h-3" /> Target: {format(parseISO(examDate), 'MMMM d, yyyy')}
              </span>
              {activeStreak > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400" /> {activeStreak} Day Streak
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 mt-1.5">
              Stay relentless. Every concept mastered compounds.
            </h2>
          </div>
        </div>

        {/* Right: Today's Focus Hours vs Goal */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-4 bg-slate-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-800">
          <div className="flex-1 min-w-[160px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Today's Focus
              </span>
              <span className="font-bold text-slate-200">
                {selectedDateStudyHours}h <span className="text-slate-500 font-normal">/ {goalHours}h</span>
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  studyPercent >= 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                }`}
                style={{ width: `${studyPercent}%` }}
              />
            </div>
          </div>

          <Link
            to="/timer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shrink-0 shadow-sm"
          >
            Start Timer
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
