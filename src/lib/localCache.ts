import { StorageData } from './storage';

const DB_NAME = 'tracker_idb_v1';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'snapshots';
const STORE_SYNC_QUEUE = 'sync_queue';
const STORE_MEDIA = 'media_blobs';

export type SyncOp = 'insert' | 'update' | 'upsert' | 'delete';

export interface SyncQueueItem {
  id: string;
  userId: string;
  table: string;
  op: SyncOp;
  payload: Record<string, unknown>;
  matchCol?: string;
  matchVal?: string;
  onConflict?: string;
  createdAt: number;
  retries: number;
  nextRetryAt: number;
}

export interface CachedSnapshot {
  userId: string;
  data: StorageData;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        const qStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' });
        qStore.createIndex('userId', 'userId', { unique: false });
        qStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getSnapshot(userId: string): Promise<CachedSnapshot | null> {
  if (!userId) return null;
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
      const req = tx.objectStore(STORE_SNAPSHOTS).get(userId);
      req.onsuccess = () => resolve((req.result as CachedSnapshot) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveSnapshot(userId: string, data: StorageData): Promise<void> {
  if (!userId) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
      tx.objectStore(STORE_SNAPSHOTS).put({
        userId,
        data,
        updatedAt: Date.now(),
      } satisfies CachedSnapshot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback handled by localStorage
  }
}

export async function deleteSnapshot(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
      tx.objectStore(STORE_SNAPSHOTS).delete(userId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

export async function enqueueMutation(
  item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retries' | 'nextRetryAt'>
): Promise<SyncQueueItem> {
  const fullItem: SyncQueueItem = {
    ...item,
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    retries: 0,
    nextRetryAt: 0,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      tx.objectStore(STORE_SYNC_QUEUE).put(fullItem);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore if IDB unavailable
  }

  return fullItem;
}

export async function getSyncQueue(userId: string): Promise<SyncQueueItem[]> {
  if (!userId) return [];
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
      const idx = tx.objectStore(STORE_SYNC_QUEUE).index('userId');
      const req = idx.getAll(userId);
      req.onsuccess = () => {
        const list = (req.result as SyncQueueItem[]) || [];
        list.sort((a, b) => a.createdAt - b.createdAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removeQueueItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      tx.objectStore(STORE_SYNC_QUEUE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

export async function updateQueueItem(item: SyncQueueItem): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      tx.objectStore(STORE_SYNC_QUEUE).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

export async function clearUserQueue(userId: string): Promise<void> {
  const items = await getSyncQueue(userId);
  await Promise.all(items.map((i) => removeQueueItem(i.id)));
}

export async function saveMediaBlob(id: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_MEDIA, 'readwrite');
      tx.objectStore(STORE_MEDIA).put({ id, dataUrl, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

export async function getMediaBlob(id: string): Promise<string | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MEDIA, 'readonly');
      const req = tx.objectStore(STORE_MEDIA).get(id);
      req.onsuccess = () => resolve((req.result as { dataUrl?: string })?.dataUrl || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}
