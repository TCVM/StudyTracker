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

  try {
    const res = await fetch('./shared-subjects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setSharedSubjectsBase(Array.isArray(data) ? data : []);
    setSharedSubjectsLocal(loadLocalSharedSubjects());
    refreshSharedSubjectsMerged();
    setSharedSubjectsLoaded(true);
  } catch (e) {
    setSharedSubjectsLoadError(e);
    setSharedSubjectsLoaded(true);
    setSharedSubjectsBase([]);
    setSharedSubjectsLocal(loadLocalSharedSubjects());
    refreshSharedSubjectsMerged();
  }

  try {
    const { renderSharedSubjects } = await import('./ui.mjs');
    renderSharedSubjects?.();
  } catch {
    // ignore
  }
}
