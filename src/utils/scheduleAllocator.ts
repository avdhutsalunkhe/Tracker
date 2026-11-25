import { TimetableBlock, AllottedSlot, GateTopic, GateSubject, Flashcard } from '../types';
import { format } from 'date-fns';

export interface FreeWindow {
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMins: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isBlockActiveOnDate(block: TimetableBlock, dateStr: string): boolean {
  if (block.day_type === 'All Days') return true;
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = day === 0 || day === 6;
  return block.day_type === 'Weekends' ? isWeekend : !isWeekend;
}

export function hasTimeOverlap(
  blocks: TimetableBlock[],
  startTime: string,
  endTime: string,
  dayType: TimetableBlock['day_type'],
  ignoreId?: string
): TimetableBlock | null {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (end <= start) return blocks[0] || null;

  for (const b of blocks) {
    if (ignoreId && b.id === ignoreId) continue;
    const sameScope =
      b.day_type === 'All Days' || dayType === 'All Days' || b.day_type === dayType;
    if (!sameScope) continue;
    const bStart = timeToMinutes(b.start_time);
    const bEnd = timeToMinutes(b.end_time);
    if (start < bEnd && end > bStart) {
      return b;
    }
  }
  return null;
}

export function detectFreeWindows(
  blocks: TimetableBlock[],
  dateStr: string,
  dayStartMins = 6 * 60, // 06:00
  dayEndMins = 23 * 60 + 30 // 23:30
): FreeWindow[] {
  const active = blocks
    .filter((b) => isBlockActiveOnDate(b, dateStr))
    .map((b) => ({
      start: Math.max(dayStartMins, timeToMinutes(b.start_time)),
      end: Math.min(dayEndMins, timeToMinutes(b.end_time)),
    }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const seg of active) {
    const last = merged[merged.length - 1];
    if (last && seg.start <= last.end) {
      last.end = Math.max(last.end, seg.end);
    } else {
      merged.push({ ...seg });
    }
  }

  const free: FreeWindow[] = [];
  let cursor = dayStartMins;

  for (const busy of merged) {
    if (busy.start - cursor >= 25) {
      free.push({
        startMinutes: cursor,
        endMinutes: busy.start,
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(busy.start),
        durationMinutes: busy.start - cursor,
      });
    }
    cursor = Math.max(cursor, busy.end);
  }

  if (dayEndMins - cursor >= 25) {
    free.push({
      startMinutes: cursor,
      endMinutes: dayEndMins,
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(dayEndMins),
      durationMinutes: dayEndMins - cursor,
    });
  }

  return free;
}

export const SAMPLE_ROUTINE_BLOCKS: Array<Omit<TimetableBlock, 'id' | 'user_id' | 'created_at'>> = [
  { title: 'Morning Walk & Breakfast', start_time: '06:30', end_time: '07:30', day_type: 'All Days', category: 'Personal' },
  { title: 'College / Classes / Work', start_time: '09:30', end_time: '13:00', day_type: 'Weekdays', category: 'Fixed' },
  { title: 'Lunch & Power Nap', start_time: '13:00', end_time: '14:15', day_type: 'All Days', category: 'Rest' },
  { title: 'Evening Tea & Exercise', start_time: '17:30', end_time: '18:30', day_type: 'All Days', category: 'Personal' },
  { title: 'Dinner & Wind Down', start_time: '21:00', end_time: '21:45', day_type: 'All Days', category: 'Rest' },
];

export function autoAllocateStudySlots(params: {
  userId: string;
  dateStr: string;
  blocks: TimetableBlock[];
  existingSlots: AllottedSlot[];
  topics: GateTopic[];
  subjects: GateSubject[];
  flashcards: Flashcard[];
}): AllottedSlot[] {
  const { userId, dateStr, blocks, existingSlots, topics, subjects, flashcards } = params;

  const lockedSlots = existingSlots.filter((s) => s.slot_date === dateStr && s.is_locked);
  const busyFromLocked: TimetableBlock[] = lockedSlots.map((s) => ({
    id: s.id,
    user_id: userId,
    title: s.title,
    start_time: s.start_time,
    end_time: s.end_time,
    day_type: 'All Days',
    category: 'Fixed',
  }));

  const freeWindows = detectFreeWindows([...blocks, ...busyFromLocked], dateStr);
  const rawChunks: Array<{ startTime: string; endTime: string; mins: number }> = [];

  for (const win of freeWindows) {
    let cur = win.startMinutes;
    while (win.endMinutes - cur >= 25) {
      const remaining = win.endMinutes - cur;
      const chunkLen = remaining >= 110 ? 75 : remaining >= 90 ? 60 : Math.min(90, remaining);
      rawChunks.push({
        startTime: minutesToTime(cur),
        endTime: minutesToTime(cur + chunkLen),
        mins: chunkLen,
      });
      cur += chunkLen;
      if (win.endMinutes - cur >= 15) {
        cur += 10; // 10-min buffer between study blocks
      }
    }
  }

  if (rawChunks.length === 0) return lockedSlots;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // 1. Overdue & Due-Today Revisions
  const dueRevisions = topics
    .filter((t) => t.status === 'Completed' && t.next_revision_date && t.next_revision_date <= todayStr)
    .sort((a, b) => (a.next_revision_date || '').localeCompare(b.next_revision_date || ''));

  // 2. High-Weightage + Low-Confidence GATE Topics
  const studyTopics = topics
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => {
      const wA = subjectMap.get(a.subject_id)?.weightage_marks ?? 8;
      const wB = subjectMap.get(b.subject_id)?.weightage_marks ?? 8;
      const scoreA = wA * (6 - a.confidence);
      const scoreB = wB * (6 - b.confidence);
      return scoreB - scoreA;
    });

  // 3. PYQ Drills / Formula Vault
  const reviewCards = flashcards.filter((f) => f.needs_review);

  const totalChunks = rawChunks.length;
  const revTarget = Math.max(dueRevisions.length > 0 ? 1 : 0, Math.round(totalChunks * 0.25));
  const pyqTarget = Math.max(1, Math.round(totalChunks * 0.2));

  const generated: AllottedSlot[] = [...lockedSlots];
  let revIdx = 0;
  let topicIdx = 0;

  rawChunks.forEach((chunk, idx) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `slot-${Date.now()}-${idx}`;

    if (idx < revTarget && revIdx < dueRevisions.length) {
      const revTopic = dueRevisions[revIdx++];
      generated.push({
        id,
        user_id: userId,
        slot_date: dateStr,
        title: `Revise: ${revTopic.topic_name}`,
        start_time: chunk.startTime,
        end_time: chunk.endTime,
        slot_type: 'Revision',
        subject_id: revTopic.subject_id,
        topic_id: revTopic.id,
        is_locked: false,
        completed: false,
      });
    } else if (idx >= totalChunks - pyqTarget) {
      const isVault = reviewCards.length > 0 && idx % 2 === 1;
      const subj = subjects[idx % Math.max(1, subjects.length)];
      generated.push({
        id,
        user_id: userId,
        slot_date: dateStr,
        title: isVault
          ? `Formula Vault Review (${reviewCards.length} due)`
          : subj
          ? `PYQ Drill: ${subj.name}`
          : 'Mixed GATE PYQ Drill',
        start_time: chunk.startTime,
        end_time: chunk.endTime,
        slot_type: isVault ? 'Vault' : 'PYQ',
        subject_id: subj?.id || null,
        topic_id: null,
        is_locked: false,
        completed: false,
      });
    } else if (topicIdx < studyTopics.length) {
      const top = studyTopics[topicIdx++];
      generated.push({
        id,
        user_id: userId,
        slot_date: dateStr,
        title: `Study: ${top.topic_name}`,
        start_time: chunk.startTime,
        end_time: chunk.endTime,
        slot_type: 'Topic',
        subject_id: top.subject_id,
        topic_id: top.id,
        is_locked: false,
        completed: false,
      });
    } else {
      const subj = subjects[idx % Math.max(1, subjects.length)];
      generated.push({
        id,
        user_id: userId,
        slot_date: dateStr,
        title: subj ? `Deep Practice: ${subj.name}` : 'GATE Core Practice & PYQs',
        start_time: chunk.startTime,
        end_time: chunk.endTime,
        slot_type: 'PYQ',
        subject_id: subj?.id || null,
        topic_id: null,
        is_locked: false,
        completed: false,
      });
    }
  });

  return generated.sort((a, b) => a.start_time.localeCompare(b.start_time));
}
