import { GateTopic, GateSubject } from '../types';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export function isConfidenceDecayed(topic: GateTopic): boolean {
  if (topic.status === 'Not Started') return false;
  const refDate = topic.last_revised_on || topic.covered_date;
  if (!refDate) return false;
  try {
    const daysSince = differenceInCalendarDays(new Date(), parseISO(refDate));
    return daysSince >= 21;
  } catch {
    return false;
  }
}

export function getEffectiveConfidence(topic: GateTopic): number {
  const base = topic.confidence || 3;
  return isConfidenceDecayed(topic) ? Math.max(1, base - 1) : base;
}

export function computeTopicROIScore(
  topic: GateTopic,
  subject?: GateSubject,
  todayStr?: string
): number {
  const weightage = subject?.weightage_marks ?? 8;
  const effConf = getEffectiveConfidence(topic);
  const today = todayStr || new Date().toISOString().split('T')[0];

  let overdueBonus = 0;
  if (topic.status === 'Completed' && topic.next_revision_date) {
    if (topic.next_revision_date < today) overdueBonus = 40;
    else if (topic.next_revision_date === today) overdueBonus = 25;
  }

  return weightage * (6 - effConf) + overdueBonus;
}
