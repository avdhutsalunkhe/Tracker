import React from 'react';
import { GateCountdown } from '../components/common/GateCountdown';
import { NextUpCard } from '../components/today/NextUpCard';
import { DateSwitcher } from '../components/today/DateSwitcher';
import { HabitList } from '../components/today/HabitList';
import { TaskList } from '../components/today/TaskList';
import { TodayScheduleWidget } from '../components/today/TodayScheduleWidget';
import { TodayGateTopicsWidget } from '../components/today/TodayGateTopicsWidget';
import { WeeklyReviewCard } from '../components/analytics/WeeklyReviewCard';

export const TodayPage: React.FC = () => {
  const isSunday = new Date().getDay() === 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Motivating GATE Countdown & Daily Goal Header */}
      <GateCountdown />

      {/* 2. Sunday Weekly Review */}
      {isSunday && <WeeklyReviewCard />}

      {/* 3. Smart Recommendation Engine */}
      <NextUpCard />

      {/* 3. Today's Planned Study Schedule */}
      <TodayScheduleWidget />

      {/* 4. GATE Topics & Subtopics Quick Access */}
      <TodayGateTopicsWidget />

      {/* 4. Date Switcher */}
      <DateSwitcher />

      {/* 5. Habit Checklist and Daily Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <HabitList />
        <TaskList />
      </div>
    </div>
  );
};

