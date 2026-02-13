import { escapeHtml, formatDateTime, formatHMS } from '../../utils/helpers.js';
import { getAppState, getCurrentSubject, setCurrentSubject } from '../core/state.mjs';
import { MAX_SESSIONS_DISPLAY } from '../core/constants.mjs';
import { ensureSubjectNotes, renderGlobalSkillTree, renderNotes, renderStats } from '../features/notes/notes-skilltree-stats.mjs';
import { saveData } from '../core/storage.mjs';
import { renderAchievementsV2 } from '../features/achievements/ui.mjs';
import { renderHomePage } from './home.mjs';
import { renderSubjectBanner } from '../shared/ui.mjs';
import { setActiveView } from './flow.mjs';
import { renderCategories, renderMap, updateSubjectProgress } from '../features/subject/view.mjs';
import { updateTimerUi } from '../features/timer/timer.mjs';

function byId(id) {
  return document.getElementById(id);
}

export function recordSession(startTime, durationSeconds, xpEarned) {
  const subject = getCurrentSubject();
  if (!subject) return;

  const session = {
    startTime,
    endTime: Date.now(),
    durationSeconds,
    xpEarned,
    difficulty: subject.meta.difficulty
  };

  if (!Array.isArray(subject.meta.sessions)) subject.meta.sessions = [];
  subject.meta.sessions.unshift(session);

  const max = Number(MAX_SESSIONS_DISPLAY ?? 0) || 50;
  if (subject.meta.sessions.length > max) {
    subject.meta.sessions = subject.meta.sessions.slice(0, max);
  }

  const appState = getAppState();
  if (appState?.globalMeta) {
    if (!Array.isArray(appState.globalMeta.sessions)) appState.globalMeta.sessions = [];
    appState.globalMeta.sessions.unshift(session);
    if (appState.globalMeta.sessions.length > max) {
      appState.globalMeta.sessions = appState.globalMeta.sessions.slice(0, max);
    }
  }

  saveData(true);
}

export function renderSessions() {
  const sessionsContainer = byId('sessionsContainer');
  if (!sessionsContainer) return;

  const subject = getCurrentSubject();
  const sessions = subject ? (subject.meta.sessions ?? []) : [];

  if (sessions.length === 0) {
    sessionsContainer.innerHTML = '<div class="sessions-empty">No hay sesiones registradas</div>';
    return;
  }

  sessionsContainer.innerHTML = sessions.map((session, index) => `
        <div class="session-item">
            <div class="session-icon">⏱️</div>
            <div class="session-info">
                <div class="session-date">Sesión ${((subject?.meta?.sessionsCount ?? 0) - index)}</div>
                <div class="session-time">${formatDateTime(session.startTime)}</div>
            </div>
            <div class="session-stats">
                <div class="session-duration">${formatHMS(session.durationSeconds)}</div>
                <div class="session-xp">+${Math.floor(session.xpEarned)} XP</div>
            </div>
        </div>
    `).join('');
}

export function renderAllNonTimer() {
  renderSubjectBanner();
  renderCategories();
  updateSubjectProgress();
  renderMap();
  renderNotes();
  renderStats();
  renderAchievementsV2();
  renderSessions();
  renderSubjectList();
  renderHomePage();
  renderGlobalSkillTree();
}

export function renderAll() {
  renderAllNonTimer();
  updateTimerUi();
}

export function renderSubjectList() {
  const subjectList = byId('subjectList');
  if (!subjectList) return;

  const appState = getAppState();
  if (!appState?.subjects) return;
  const currentSubject = getCurrentSubject();

  subjectList.innerHTML = '';

  appState.subjects.forEach((subject) => {
    const progress = calculateSubjectProgress(subject);

    const btn = document.createElement('button');
    btn.className = `nav-item ${currentSubject?.id === subject.id ? 'active' : ''}`;
    btn.dataset.subjectId = subject.id;
    btn.innerHTML = `
            <span class="nav-icon">${subject.icon}</span>
            <span class="nav-text">${escapeHtml(subject.name ?? '')}</span>
            <span class="nav-progress">${progress}%</span>
        `;
    subjectList.appendChild(btn);
  });
}

export function calculateSubjectProgress(subject) {
  let totalTopics = 0;
  let completedTopics = 0;

  for (const category of subject.categories) {
    totalTopics += category.topics.length;
    completedTopics += category.topics.filter((t) => t.completed).length;
  }

  return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
}

export function selectSubject(subjectId) {
  const appState = getAppState();
  if (!appState?.subjects) return;

  setCurrentSubject(appState.subjects.find((sub) => sub.id === subjectId) ?? null);

  const subject = getCurrentSubject();
  if (subject) {
    ensureSubjectNotes(subject);
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.subjectId == subjectId);
    });

    const subjectTitle = byId('subjectTitle');
    const subjectSubtitle = byId('subjectSubtitle');
    if (subjectTitle) subjectTitle.textContent = subject.name;
    if (subjectSubtitle) subjectSubtitle.textContent = 'Progreso de estudio';

    renderSubjectBanner();
    setActiveView('subjectView');
    setActiveView('listView');
    renderAll();
  }
}
