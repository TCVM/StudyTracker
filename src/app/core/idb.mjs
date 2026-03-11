const DB_NAME = 'study-tracker-idb';
const DB_VERSION = 1;
const STORE_TOPIC_NOTE_IMAGES = 'topicNoteImages';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('IndexedDB no disponible'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TOPIC_NOTE_IMAGES)) {
        db.createObjectStore(STORE_TOPIC_NOTE_IMAGES, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('No se pudo abrir IndexedDB'));
  });

  return dbPromise;
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB tx error'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB tx abort'));
  });
}

export async function putTopicNoteImage(id, blob, meta = null) {
  const db = await openDb();
  const tx = db.transaction(STORE_TOPIC_NOTE_IMAGES, 'readwrite');
  const store = tx.objectStore(STORE_TOPIC_NOTE_IMAGES);

  const record = {
    id: String(id),
    blob,
    type: String(meta?.type ?? blob?.type ?? ''),
    createdAt: Number.isFinite(Number(meta?.createdAt)) ? Number(meta.createdAt) : Date.now()
  };

  store.put(record);
  await txDone(tx);
  return record.id;
}

export async function getTopicNoteImage(id) {
  const db = await openDb();
  const tx = db.transaction(STORE_TOPIC_NOTE_IMAGES, 'readonly');
  const store = tx.objectStore(STORE_TOPIC_NOTE_IMAGES);

  const res = await new Promise((resolve, reject) => {
    const req = store.get(String(id));
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB get error'));
  });

  return res?.blob ?? null;
}

export async function deleteTopicNoteImage(id) {
  const db = await openDb();
  const tx = db.transaction(STORE_TOPIC_NOTE_IMAGES, 'readwrite');
  const store = tx.objectStore(STORE_TOPIC_NOTE_IMAGES);
  store.delete(String(id));
  await txDone(tx);
}

// Generic image helpers (reuse the same store to keep things simple).
export async function putImage(id, blob, meta = null) {
  return putTopicNoteImage(id, blob, meta);
}

export async function getImage(id) {
  return getTopicNoteImage(id);
}

export async function deleteImage(id) {
  return deleteTopicNoteImage(id);
}
