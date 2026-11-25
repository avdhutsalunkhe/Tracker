import { supabase, isSupabaseConfigured } from './supabase';
import {
  SyncQueueItem,
  getSyncQueue,
  removeQueueItem,
  updateQueueItem,
  enqueueMutation,
  SyncOp,
  getSnapshot,
  deleteSnapshot,
} from './localCache';

export type SyncStatus = 'Synced' | 'Syncing...' | 'Offline Cached';

async function executeQueueItem(item: SyncQueueItem): Promise<void> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase unavailable');
  }

  const client = supabase;
  if (item.op === 'insert') {
    const { error } = await client.from(item.table).insert(item.payload);
    if (error) throw error;
  } else if (item.op === 'upsert') {
    const { error } = await client
      .from(item.table)
      .upsert(item.payload, item.onConflict ? { onConflict: item.onConflict } : undefined);
    if (error) throw error;
  } else if (item.op === 'update') {
    const col = item.matchCol || 'id';
    const val = item.matchVal || (item.payload.id as string);
    const { error } = await client.from(item.table).update(item.payload).eq(col, val);
    if (error) throw error;
  } else if (item.op === 'delete') {
    const col = item.matchCol || 'id';
    const val = item.matchVal || (item.payload.id as string);
    const { error } = await client.from(item.table).delete().eq(col, val);
    if (error) throw error;
  }
}

export async function queueOrRunMutation(params: {
  userId: string;
  table: string;
  op: SyncOp;
  payload: Record<string, unknown>;
  matchCol?: string;
  matchVal?: string;
  onConflict?: string;
  onStatusChange?: (status: SyncStatus) => void;
}): Promise<boolean> {
  const { userId, table, op, payload, matchCol, matchVal, onConflict, onStatusChange } = params;

  if (!userId || !isSupabaseConfigured || !supabase) {
    return false;
  }

  // Always enqueue first for guaranteed offline durability, then flush if online
  const queued = await enqueueMutation({
    userId,
    table,
    op,
    payload,
    matchCol,
    matchVal,
    onConflict,
  });

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    onStatusChange?.('Offline Cached');
    return false;
  }

  onStatusChange?.('Syncing...');
  try {
    await executeQueueItem(queued);
    await removeQueueItem(queued.id);
    const remaining = await getSyncQueue(userId);
    onStatusChange?.(remaining.length === 0 ? 'Synced' : 'Syncing...');
    return true;
  } catch {
    const nextRetries = queued.retries + 1;
    const backoffMs = Math.min(30000, 1000 * Math.pow(2, nextRetries));
    await updateQueueItem({
      ...queued,
      retries: nextRetries,
      nextRetryAt: Date.now() + backoffMs,
    });
    onStatusChange?.(typeof navigator !== 'undefined' && !navigator.onLine ? 'Offline Cached' : 'Syncing...');
    return false;
  }
}

export async function flushSyncQueue(
  userId: string,
  onStatusChange?: (status: SyncStatus) => void
): Promise<number> {
  if (!userId || !isSupabaseConfigured || !supabase) return 0;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    onStatusChange?.('Offline Cached');
    return 0;
  }

  const queue = await getSyncQueue(userId);
  if (queue.length === 0) {
    onStatusChange?.('Synced');
    return 0;
  }

  onStatusChange?.('Syncing...');
  const now = Date.now();
  let flushed = 0;

  for (const item of queue) {
    if (item.nextRetryAt > now) continue;
    try {
      await executeQueueItem(item);
      await removeQueueItem(item.id);
      flushed++;
    } catch {
      const nextRetries = item.retries + 1;
      const backoffMs = Math.min(30000, 1000 * Math.pow(2, nextRetries));
      await updateQueueItem({
        ...item,
        retries: nextRetries,
        nextRetryAt: Date.now() + backoffMs,
      });
    }
  }

  const remaining = await getSyncQueue(userId);
  onStatusChange?.(
    typeof navigator !== 'undefined' && !navigator.onLine
      ? 'Offline Cached'
      : remaining.length === 0
      ? 'Synced'
      : 'Syncing...'
  );

  return flushed;
}

/**
 * Auto-merges any guest local snapshot into the authenticated user's Supabase account upon sign-in.
 */
export async function mergeGuestSnapshotIfPresent(userId: string): Promise<boolean> {
  if (!userId || !isSupabaseConfigured || !supabase) return false;
  const guestSnap = await getSnapshot('local_guest_user');
  if (!guestSnap) return false;

  const { data } = guestSnap;
  const hasGuestRecords =
    data.habits.length > 0 ||
    data.tasks.length > 0 ||
    data.subjects.length > 0 ||
    data.topics.length > 0 ||
    data.mockTests.length > 0 ||
    data.flashcards.length > 0;

  if (!hasGuestRecords) {
    await deleteSnapshot('local_guest_user');
    return false;
  }

  const client = supabase;
  try {
    if (data.habits.length > 0) {
      await client.from('daily_habits').upsert(data.habits.map((h) => ({ ...h, user_id: userId })));
    }
    if (data.habitLogs.length > 0) {
      await client
        .from('habit_logs')
        .upsert(data.habitLogs.map((l) => ({ ...l, user_id: userId })), { onConflict: 'habit_id,log_date' });
    }
    if (data.tasks.length > 0) {
      await client.from('daily_tasks').upsert(data.tasks.map((t) => ({ ...t, user_id: userId })));
    }
    if (data.subjects.length > 0) {
      await client.from('gate_subjects').upsert(data.subjects.map((s) => ({ ...s, user_id: userId })));
    }
    if (data.topics.length > 0) {
      await client.from('gate_topics').upsert(data.topics.map((t) => ({ ...t, user_id: userId })));
    }
    if (data.revisions.length > 0) {
      await client.from('gate_revisions').upsert(data.revisions.map((r) => ({ ...r, user_id: userId })));
    }
    if (data.sessions.length > 0) {
      await client.from('study_sessions').upsert(data.sessions.map((s) => ({ ...s, user_id: userId })));
    }
    if (data.mockTests.length > 0) {
      await client.from('mock_tests').upsert(data.mockTests.map((m) => ({ ...m, user_id: userId })));
    }
    if (data.mistakes.length > 0) {
      await client.from('mistake_logs').upsert(data.mistakes.map((m) => ({ ...m, user_id: userId })));
    }
    if (data.flashcards.length > 0) {
      await client.from('flashcards').upsert(data.flashcards.map((f) => ({ ...f, user_id: userId })));
    }
    await deleteSnapshot('local_guest_user');
    return true;
  } catch {
    return false;
  }
}
