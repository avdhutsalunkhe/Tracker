import React from 'react';
import { GateCountdown } from '../components/common/GateCountdown';
import { NextUpCard } from '../components/today/NextUpCard';
import { DateSwitcher } from '../components/today/DateSwitcher';
import { HabitList } from '../components/today/HabitList';
import { TaskList } from '../components/today/TaskList';

export const TodayPage: React.FC = () => {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Motivating GATE Countdown & Daily Goal Header */}
      <GateCountdown />

      {/* 2. Smart Recommendation Engine */}
      <NextUpCard />

      {/* 3. Date Switcher */}
      <DateSwitcher />

      {/* 4. Habit Checklist and Daily Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <HabitList />
        <TaskList />
      </div>
    </div>
  );
};
