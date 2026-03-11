import { escapeHtml, prettyTime, formatDurationMs } from '../../utils/helpers.js';
import { calculateSubjectProgress, selectSubject } from './render.mjs';
import { globalAchievementDefinitionsV2 } from '../features/achievements/definitions.mjs';
import { getAppState } from '../core/state.mjs';
import {
  ensureHomeAchievementsPanelV2,
  ensureHomeStatsPanelV2,
  renderHomeAchievementsV2,
  renderHomeStatsV2
} from '../features/achievements/ui.mjs';
import { getGlobalLevelInfo, getAverageSubjectLevelPercent } from '../features/xp/xp.mjs';
import { setActiveView } from './flow.mjs';

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

  // Renderizar barra de nivel global
  renderGlobalLevelBar();

  ensureHomeAchievementsPanelV2();
  renderHomeAchievementsV2();
  ensureHomeStatsPanelV2();
  renderHomeStatsV2();
  renderRecentSubjects();
  renderHomeUpcomingExams();
}

export function renderHomeUpcomingExams() {
  const container = byId('homeUpcomingExamsList');
  if (!container) return;
  const appState = getAppState();
  if (!appState) return;

  const now = Date.now();
  const items = [];

  (appState.subjects ?? []).forEach((subject) => {
    const upcoming = Array.isArray(subject?.upcomingExams) ? subject.upcomingExams : [];
    upcoming.forEach((x) => {
      const at = Number(x?.at);
      if (!Number.isFinite(at) || at <= now) return;
      items.push({
        subjectId: subject.id,
        subjectName: String(subject.name ?? 'Materia'),
        subjectIcon: String(subject.icon ?? '📚'),
        title: String(x?.title ?? '').trim(),
        at
      });
    });
  });

  items.sort((a, b) => a.at - b.at);

  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<div class="home-upcoming-empty">No hay próximos exámenes.</div>';
    return;
  }

  const getUrgency = (remainingMs) => {
    if (remainingMs <= 0) return 'overdue';
    if (remainingMs < 24 * 60 * 60 * 1000) return 'soon';
    return 'ok';
  };

  items.slice(0, 8).forEach((item, idx) => {
    const isNext = idx === 0;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'upcoming-exam-item';
    row.dataset.urgency = getUrgency(item.at - now);

    const left = document.createElement('div');
    left.className = 'upcoming-exam-left';

    const titleEl = document.createElement('div');
    titleEl.className = 'upcoming-exam-title';
    const examTitle = item.title ? ` — ${item.title}` : '';
    titleEl.textContent = `${isNext ? 'Próximo — ' : ''}${item.subjectIcon} ${item.subjectName}${examTitle}`;

    const metaEl = document.createElement('div');
    metaEl.className = 'upcoming-exam-meta';
    metaEl.textContent = `En ${formatDurationMs(item.at - now)}`;

    left.appendChild(titleEl);
    left.appendChild(metaEl);

    row.appendChild(left);

    row.addEventListener('click', () => {
      selectSubject(item.subjectId);
      setTimeout(() => setActiveView('examsView'), 0);
    });

    container.appendChild(row);
  });
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

export function renderGlobalLevelBar() {
  const fill = byId('globalLevelBarFill');
  const text = byId('globalLevelBarText');
  const levelNum = byId('globalLevelNumber');
  const xpInfo = byId('globalXpInfo');
  if (!fill || !text || !levelNum || !xpInfo) return;

  const info = getGlobalLevelInfo();
  const avgPct = getAverageSubjectLevelPercent();

  if (info) {
    // use average percent for the bar fill rather than global xp percent
    fill.style.width = `${avgPct}%`;
    text.textContent = `${avgPct}%`;

    // compute average level across subjects
    const appState = getAppState();
    let avgLevel = info.level;
    if (appState?.subjects && appState.subjects.length > 0) {
      const sum = appState.subjects.reduce((sum, s) => sum + (Number(s.meta?.level) || 1), 0);
      avgLevel = Math.floor(sum / appState.subjects.length);
    }
    levelNum.textContent = `Nivel promedio ${avgLevel}`;

    xpInfo.textContent = `XP global: ${info.xp} / ${info.needed}`;
  }

  // show average subject percent as tooltip
  fill.title = `Promedio por materia: ${avgPct}%`;
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
