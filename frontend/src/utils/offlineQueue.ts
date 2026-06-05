import { openDB } from 'idb';

export interface QueuedComplaint {
  title: string;
  description?: string;
  category: string;
  severity: number;
  status?: string;
  latitude: number;
  longitude: number;
  district?: string;
  ward?: string;
  street?: string;
  imageUrl?: string;
  blurhash?: string;
  priority?: number;
  slaDeadline?: string;
  isDuplicate?: boolean;
  queuedAt: string;
}

const DB_NAME = 'fix-karachi-offline';
const STORE = 'complaints';

const getDb = () => openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: 'queuedAt' });
    }
  }
});

export async function queueComplaint(payload: Omit<QueuedComplaint, 'queuedAt'>) {
  const db = await getDb();
  const record: QueuedComplaint = {
    ...payload,
    queuedAt: new Date().toISOString(),
  };
  await db.put(STORE, record);
  return record;
}

export async function getQueuedComplaints(): Promise<QueuedComplaint[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function removeQueuedComplaint(queuedAt: string) {
  const db = await getDb();
  await db.delete(STORE, queuedAt);
}
