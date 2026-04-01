import { safeJsonParse } from '../core/storage.mjs';
import {
  getSharedSubjectsBase,
  getSharedSubjectsLocal,
  setSharedSubjects,
  setSharedSubjectsBase,
  setSharedSubjectsLoaded,
  setSharedSubjectsLoadError,
  setSharedSubjectsLocal
} from './state.mjs';
import { listCloudSharedSubjects } from './cloud.mjs';

const LOCAL_SHARED_SUBJECTS_KEY = 'studyTrackerSharedSubjectsV1';

export function normalizeBannerUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return raw;
}

export function loadLocalSharedSubjects() {
  const raw = localStorage.getItem(LOCAL_SHARED_SUBJECTS_KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  if (Array.isArray(parsed)) return parsed;
  return [];
}

export function saveLocalSharedSubjects(list) {
  try {
    localStorage.setItem(LOCAL_SHARED_SUBJECTS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  } catch {
    // ignore
  }
}

export function refreshSharedSubjectsMerged() {
  const base = getSharedSubjectsBase();
  const local = getSharedSubjectsLocal();
  return setSharedSubjects([...(Array.isArray(local) ? local : []), ...(Array.isArray(base) ? base : [])]);
}

export function estimateSharedSubjectSize(subject) {
  try {
    const categories = Array.isArray(subject?.categories) ? subject.categories : [];
    const topics = categories.reduce((sum, c) => sum + (Array.isArray(c?.topics) ? c.topics.length : 0), 0);
    return { categories: categories.length, topics };
  } catch {
    return { categories: 0, topics: 0 };
  }
}

export async function loadSharedSubjects() {
  setSharedSubjectsLoaded(false);
  setSharedSubjectsLoadError(null);
  let loadError = null;

  try {
    const res = await fetch('./shared-subjects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setSharedSubjectsBase(Array.isArray(data) ? data : []);
  } catch (e) {
    loadError = e;
    setSharedSubjectsBase([]);
  }

  const cloudSubjects = [];
  try {
    const cloud = await listCloudSharedSubjects({ limit: 12 });
    const items = Array.isArray(cloud?.items) ? cloud.items : [];
    for (const item of items) {
      const payload = item?.payload && typeof item.payload === 'object' ? item.payload : null;
      if (!payload) continue;
      cloudSubjects.push({
        ...payload,
        __sharedMeta: {
          source: 'cloud',
          id: String(item?.id ?? ''),
          ownerLogin: String(item?.owner?.login ?? '').trim(),
          ownerAvatarUrl: String(item?.owner?.avatarUrl ?? '').trim(),
          updatedAt: String(item?.updatedAt ?? '')
        }
      });
    }
  } catch (e) {
    if (!loadError) loadError = e;
  }

  setSharedSubjectsLocal(loadLocalSharedSubjects());
  setSharedSubjects([
    ...cloudSubjects,
    ...(Array.isArray(getSharedSubjectsLocal()) ? getSharedSubjectsLocal() : []),
    ...(Array.isArray(getSharedSubjectsBase()) ? getSharedSubjectsBase() : [])
  ]);
  setSharedSubjectsLoadError(loadError);
  setSharedSubjectsLoaded(true);

  try {
    const { renderSharedSubjects } = await import('./ui.mjs');
    renderSharedSubjects?.();
  } catch {
    // ignore
  }
}
