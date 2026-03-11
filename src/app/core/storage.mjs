import { APP_VERSION, STORAGE_KEY_V1, STORAGE_KEY_V2 } from './constants.mjs';
import { showConfirmModalV2 } from '../ui/confirm-modal.mjs';
import { getAppState, setAppState, setCurrentSubject } from './state.mjs';
import { initialArchitectureData } from '../../utils/initialData.js';
import { showNotification } from '../../utils/helpers.js';
import { setActiveView } from '../ui/flow.mjs';

async function renderAllSafe() {
  try {
    const mod = await import('../ui/render.mjs');
    mod.renderAll?.();
  } catch (err) {
    console.error(err);
  }
}

function getInitialArchitectureData() {
  const data = initialArchitectureData;
  if (data && typeof data === 'object' && Array.isArray(data.categories)) return data;
  return { categories: [] };
}

export function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function createDefaultState() {
  return {
    version: APP_VERSION,
    subjects: [],
    globalMeta: {
      xp: 0,
      level: 1,
      skillPoints: 0,
      unlockedSkills: [],
      achievements: {},
      totalFocusSeconds: 0,
      sessionsCount: 0,
      longestSessionSeconds: 0,
      dailyFocusSeconds: {},
      sessions: []
    }
  };
}

export function createSubject(id, name, icon, color) {
  return {
    id,
    name,
    icon,
    color,
    categories: [],
    notes: { items: [], activeId: null, links: [] },
    exams: [],
    practices: [],
    upcomingExams: [],
    nextExamAt: null,
    meta: {
      difficulty: 'normal',
      pomodoro: { mode: 'off', workSeconds: 25 * 60, breakSeconds: 5 * 60 },
      alarm: { mode: 'off', seconds: 0 },
      xp: 0,
      level: 1,
      skillPoints: 0,
      unlockedSkills: [],
      achievements: {},
      totalFocusSeconds: 0,
      sessionsCount: 0,
      longestSessionSeconds: 0,
      dailyFocusSeconds: {},
      sessions: [],
      timer: {
        running: false,
        sessionSeconds: 0,
        streakSeconds: 0,
        xpCarrySeconds: 0,
        lastTickMs: null,
        pausedAtMs: null,
        currentSessionStartMs: null
      }
    }
  };
}

export function createSubjectFromInitialData() {
  const subject = createSubject(1, 'Arquitectura y Organización de Computadoras', '💻', '#667eea');
  const initialArchitectureData = getInitialArchitectureData();
  subject.categories = initialArchitectureData.categories.map((category) => ({
    ...category,
    topics: category.topics.map((topic) => ({
      name: topic.name,
      level: topic.level ?? 1,
      completed: false,
      completedAt: null,
      completionXp: null,
      reviews: []
    }))
  }));
  return subject;
}

export function normalizeLoadedState(loaded) {
  const base = createDefaultState();

  if (!loaded || typeof loaded !== 'object') {
    return base;
  }

  if (!loaded.version && Array.isArray(loaded.categories) && loaded.categories.length) {
    const subject = createSubject(1, 'Arquitectura y Organización de Computadoras', '💻', '#667eea');
    subject.name = 'Materia importada';
    subject.icon = '📚';
    subject.categories = loaded.categories.map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      topics: (category.topics || []).map((t) => ({
        name: t.name ?? String(t),
        level: t.level ?? 1,
        completed: !!t.completed,
        completedAt: t.completedAt ?? (t.completed ? Date.now() : null),
        reviews: Array.isArray(t.reviews) ? t.reviews : []
      }))
    }));
    base.subjects.push(subject);
    return base;
  }

  const merged = {
    ...base,
    ...loaded,
    globalMeta: {
      ...base.globalMeta,
      ...(loaded.globalMeta || {})
    }
  };

  if (!Array.isArray(merged.subjects) || merged.subjects.length === 0) {
    merged.subjects = [];
  }

  if (merged.subjects.length > 0) {
    merged.subjects = merged.subjects.map((subject) => {
      const baseSubject = createSubject(
        subject.id || Date.now(),
        subject.name || 'Materia',
        subject.icon || '📚',
        subject.color || '#667eea'
      );

      const upcomingRaw = Array.isArray(subject.upcomingExams) ? subject.upcomingExams : [];
      const upcomingExams = upcomingRaw
        .filter((x) => x && typeof x === 'object')
        .map((x, idx) => {
          const at = Number(x.at ?? x.date ?? x.ts);
          const id = String(x.id ?? `up_${subject.id ?? Date.now()}_${idx}_${at}`);
          const title = String(x.title ?? '').trim();
          return { id, title, at };
        })
        .filter((x) => Number.isFinite(x.at));

      // Migrate legacy single nextExamAt into upcomingExams if needed.
      const legacyAt = Number(subject.nextExamAt);
      if (!upcomingExams.length && Number.isFinite(legacyAt) && legacyAt) {
        upcomingExams.push({ id: `nx_${subject.id ?? Date.now()}_${legacyAt}`, title: '', at: legacyAt });
      }

      upcomingExams.sort((a, b) => a.at - b.at);

      const now = Date.now();
      const nextUpcoming = upcomingExams.find((x) => x.at > now) ?? null;

      return {
        ...baseSubject,
        exams: Array.isArray(subject.exams) ? subject.exams : [],
        practices: Array.isArray(subject.practices) ? subject.practices : [],
        ...subject,
        upcomingExams,
        // keep nextExamAt for backwards-compat UI; derived from upcomingExams
        nextExamAt: nextUpcoming ? nextUpcoming.at : null,
        categories: (subject.categories || []).map((category) => ({
          ...category,
          topics: (category.topics || []).map((t) => ({
            name: t.name,
            level: t.level ?? 1,
            completed: !!t.completed,
            completedAt: t.completedAt ?? (t.completed ? Date.now() : null),
            completionXp: Number(t.completionXp) || null,
            reviews: Array.isArray(t.reviews) ? t.reviews : [],
            note: (t && typeof t === 'object' && t.note && typeof t.note === 'object') ? {
              text: typeof t.note.text === 'string' ? t.note.text : '',
              images: Array.isArray(t.note.images) ? t.note.images.map(String).filter(Boolean) : []
            } : undefined
          }))
        })),
        meta: {
          ...createSubject(subject.id, subject.name, subject.icon, subject.color).meta,
          ...(subject.meta || {}),
          timer: {
            ...createSubject(subject.id, subject.name, subject.icon, subject.color).meta.timer,
            ...((subject.meta && subject.meta.timer) ? subject.meta.timer : {}),
            running: false,
            lastTickMs: null
          }
        }
      };
    });
  }

  return merged;
}

let lastSaveMs = 0;
let quotaWarnedAtMs = 0;

export function saveData(force = false) {
  const now = Date.now();
  if (!force && now - lastSaveMs < 1500) return;
  lastSaveMs = now;
  try {
    const state = getAppState();
    if (!state || typeof state !== 'object' || !Array.isArray(state.subjects)) return;
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
  } catch (e) {
    const name = String(e?.name ?? '');
    const msg = String(e?.message ?? '');
    const isQuota = name === 'QuotaExceededError' || msg.toLowerCase().includes('quota');
    if (isQuota) {
      // Avoid spamming the UI if autosave keeps retrying.
      if (now - quotaWarnedAtMs > 12_000) {
        quotaWarnedAtMs = now;
        showNotification('Almacenamiento lleno. Borrá imágenes/adjuntos grandes o exportá un backup.');
      }
      return;
    }
    console.error('Error al guardar progreso:', e);
  }
}

export function loadData() {
  // Intentar cargar datos existentes primero
  const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
  if (savedV2) {
    try {
      const loaded = JSON.parse(savedV2);
      setAppState(normalizeLoadedState(loaded));
      console.log('✓ Datos cargados desde localStorage V2');
      return;
    } catch (e) {
      console.error('✗ Error al parsear datos V2:', e);
    }
  }

  // Si no hay datos V2, intentar V1
  const savedV1 = localStorage.getItem(STORAGE_KEY_V1);
  if (savedV1) {
    try {
      const loaded = JSON.parse(savedV1);
      setAppState(normalizeLoadedState(loaded));
      console.log('✓ Datos cargados desde localStorage V1');
      return;
    } catch (e) {
      console.error('✗ Error al parsear datos V1:', e);
    }
  }

  // Si no hay datos guardados, crear estado por defecto
  console.log('Creando nuevo estado por defecto (sin materias)');
  setAppState(createDefaultState());
}

export function buildBackupPayload() {
  return {
    app: 'StudyTracker',
    schema: 'backup',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: getAppState()
  };
}

export function downloadJson(filename, obj) {
  const text = JSON.stringify(obj, null, 2);
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export function safeFilename(text) {
  return String(text ?? '')
    .trim()
    .replaceAll(/[\\/:*?"<>|]+/g, '-')
    .replaceAll(/\s+/g, ' ')
    .slice(0, 80) || 'materia';
}

export function exportBackupToFile() {
  const iso = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  const filename = `study-tracker-backup-${iso}.json`;
  downloadJson(filename, buildBackupPayload());
  showNotification('Backup exportado.');
}

export async function importBackupText(text) {
  const parsed = safeJsonParse(String(text ?? '').trim());
  if (!parsed) {
    showNotification('No se pudo importar: JSON inválido.');
    return;
  }

  const maybeState = parsed?.data ?? parsed?.appState ?? parsed;
  const normalized = normalizeLoadedState(maybeState);

  const ok = await showConfirmModalV2({
    title: '📥 Importar Backup',
    text: 'Esto reemplaza tu progreso actual (materias, sesiones, XP y logros).',
    confirmText: 'Importar',
    cancelText: 'Cancelar',
    fallbackText: '¿Importar backup? Esto reemplaza tu progreso actual.'
  });

  if (!ok) return;

  setAppState(normalized);
  setCurrentSubject(null);

  setActiveView('homeView');
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === 'homeView');
  });

  saveData(true);
  await renderAllSafe();
  showNotification('Backup importado.');
}

export async function resetData() {
  const ok = await showConfirmModalV2({
    title: '🧨 Reiniciar TODO',
    text: 'Esto borra TODAS las materias, temas/subtemas, sesiones, XP y logros. No se puede deshacer.',
    confirmText: 'Sí, reiniciar todo',
    cancelText: 'Cancelar',
    fallbackText: '¿Reiniciar TODO?'
  });

  if (!ok) return;

  setAppState(createDefaultState());
  saveData(true);
  setCurrentSubject(null);
  await renderAllSafe();
  showNotification('Progreso reiniciado.');
}
