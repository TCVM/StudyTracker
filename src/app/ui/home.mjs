import { escapeHtml, prettyTime } from '../../utils/helpers.js';
import { calculateSubjectProgress, selectSubject } from './render.mjs';
import { globalAchievementDefinitionsV2 } from '../features/achievements/definitions.mjs';
import { getAppState } from '../core/state.mjs';
import {
  ensureHomeAchievementsPanelV2,
  ensureHomeStatsPanelV2,
  renderHomeAchievementsV2,
  renderHomeStatsV2
} from '../features/achievements/ui.mjs';

function byId(id) {
  return document.getElementById(id);
}

export function renderHomePage() {
  const appState = getAppState();
  if (!appState) return;

  const totalSubjects = Array.isArray(appState.subjects) ? appState.subjects.length : 0;
  const globalDefs = globalAchievementDefinitionsV2();
  const globalUnlocked = globalDefs.reduce((sum, a) => {
    const unlocked = (appState.globalMeta?.achievements ?? {})[a.id] ? 1 : 0;
    return sum + unlocked;
  }, 0);

  const subjectUnlocked = (appState.subjects ?? []).reduce((sum, s) => {
    const prefix = `subj_${s.id}_`;
    const ids = Object.keys(s?.meta?.achievements ?? {}).filter((id) => id.startsWith(prefix));
    return sum + ids.length;
  }, 0);

  const totalAchievements = globalUnlocked + subjectUnlocked;
  const totalTime = prettyTime(appState.globalMeta?.totalFocusSeconds ?? 0);
  const globalProgress = calculateGlobalProgress();

  const totalSubjectsEl = byId('totalSubjects');
  const totalAchievementsEl = byId('totalAchievements');
  const totalTimeEl = byId('totalTime');
  const globalProgressEl = byId('globalProgress');

  if (totalSubjectsEl) totalSubjectsEl.textContent = String(totalSubjects);
  if (totalAchievementsEl) totalAchievementsEl.textContent = String(totalAchievements);
  if (totalTimeEl) totalTimeEl.textContent = String(totalTime);
  if (globalProgressEl) globalProgressEl.textContent = `${globalProgress}%`;

  ensureHomeAchievementsPanelV2();
  renderHomeAchievementsV2();
  ensureHomeStatsPanelV2();
  renderHomeStatsV2();
  renderRecentSubjects();
}

export function calculateGlobalProgress() {
  const appState = getAppState();
  if (!appState) return 0;

  let totalTopics = 0;
  let completedTopics = 0;

  (appState.subjects ?? []).forEach((subject) => {
    (subject.categories ?? []).forEach((category) => {
      totalTopics += (category.topics ?? []).length;
      completedTopics += (category.topics ?? []).filter((t) => t.completed).length;
    });
  });

  return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
}

export function renderRecentSubjects() {
  const recentSubjectsGrid = byId('recentSubjectsGrid');
  if (!recentSubjectsGrid) return;
  const appState = getAppState();
  if (!appState) return;

  recentSubjectsGrid.innerHTML = '';

  const recentSubjects = [...(appState.subjects ?? [])]
    .sort((a, b) => getSubjectLastActivity(b) - getSubjectLastActivity(a))
    .slice(0, 6);

  recentSubjects.forEach((subject) => {
    const progress = calculateSubjectProgress(subject);

    const card = document.createElement('button');
    card.className = 'subject-card';
    card.dataset.subjectId = subject.id;
    card.innerHTML = `
            <div class="subject-card-icon">${subject.icon}</div>
            <div class="subject-card-name">${escapeHtml(subject.name ?? '')}</div>
            <div class="subject-card-progress">${progress}% completado</div>
        `;

    card.addEventListener('click', () => selectSubject(subject.id));
    recentSubjectsGrid.appendChild(card);
  });
}

export function getSubjectLastActivity(subject) {
  const sessions = Array.isArray(subject?.meta?.sessions) ? subject.meta.sessions : [];
  const sessionDates = sessions.map((s) => Number(s.startTime) || 0).filter((x) => x > 0);
  return sessionDates.length > 0 ? Math.max(...sessionDates) : 0;
}
