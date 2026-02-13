import { escapeHtml, formatDateTime, prettyTime } from '../../../utils/helpers.js';
import { calculateGlobalProgress } from '../../ui/home.mjs';
import { calculateSubjectProgress } from '../../ui/render.mjs';
import { globalAchievementDefinitionsV2, subjectAchievementDefinitionsV2 } from './definitions.mjs';
import { getAppState, getCurrentSubject } from '../../core/state.mjs';

export { globalAchievementDefinitionsV2, subjectAchievementDefinitionsV2 };

function achievementV2GroupLabel(kind) {
  const labels = {
    progress: 'Progreso',
    total: 'Tiempo total',
    streak: 'Racha de sesión',
    time: 'Horarios y consistencia',
    special: 'Especiales',
    topic: 'Por materia'
  };
  return labels[kind] ?? 'Logros';
}

function ensureAchievementUiStateV2() {
  const appState = getAppState();
  if (!appState) return {};
  if (!appState.globalMeta) appState.globalMeta = {};
  if (!appState.globalMeta.ui) appState.globalMeta.ui = {};
  if (!appState.globalMeta.ui.achievementGroups) appState.globalMeta.ui.achievementGroups = {};
  return appState.globalMeta.ui.achievementGroups;
}

function isAchievementGroupCollapsedV2(key, defaultCollapsed = false) {
  const store = ensureAchievementUiStateV2();
  if (!key) return !!defaultCollapsed;
  if (typeof store[key] !== 'boolean') store[key] = !!defaultCollapsed;
  return !!store[key];
}

function setAchievementGroupCollapsedV2(key, collapsed) {
  if (!key) return;
  const store = ensureAchievementUiStateV2();
  store[key] = !!collapsed;
}

function renderAchievementCollapsibleGroupV2(parentGrid, label, options = null) {
  const key = options?.key ?? null;
  const defaultCollapsed = !!options?.defaultCollapsed;

  const wrapper = document.createElement('div');
  wrapper.className = 'achievement-group';

  const collapsed = isAchievementGroupCollapsedV2(key, defaultCollapsed);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'achievement-group-toggle section-title';
  btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

  const labelSpan = document.createElement('span');
  labelSpan.className = 'achievement-group-label';
  labelSpan.textContent = label;

  const chev = document.createElement('span');
  chev.className = 'achievement-group-chevron';
  chev.textContent = collapsed ? '⌄' : '⌃';

  btn.appendChild(labelSpan);
  btn.appendChild(chev);

  const content = document.createElement('div');
  content.className = 'achievement-group-content achievements-grid';
  content.hidden = collapsed;

  btn.addEventListener('click', () => {
    content.hidden = !content.hidden;
    const isCollapsed = content.hidden;
    chev.textContent = isCollapsed ? '⌄' : '⌃';
    btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    setAchievementGroupCollapsedV2(key, isCollapsed);
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(content);
  parentGrid.appendChild(wrapper);
  return content;
}

function renderAchievementCardV2(container, a, unlockedAt) {
  const unlocked = !!unlockedAt;
  const badge = unlocked ? '<span class="badge unlocked">Desbloqueado</span>' : '<span class="badge">Bloqueado</span>';
  const meta = unlocked ? `<div class="card-meta"><span>Desbloqueado: ${escapeHtml(formatDateTime(unlockedAt))}</span></div>` : '';

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
        <div class="card-title">${escapeHtml(a.title)} ${badge}</div>
        <div class="card-desc">${escapeHtml(a.desc)}</div>
        ${meta}
    `;
  container.appendChild(card);
}

export function renderGlobalAchievementsGridV2(container) {
  if (!container) return;
  const appState = getAppState();
  const unlockedById = appState?.globalMeta?.achievements ?? {};
  const allAchievements = globalAchievementDefinitionsV2();
  const knownIds = new Set(allAchievements.map((a) => a.id));

  const kinds = ['progress', 'total', 'streak', 'time', 'special'];
  for (const kind of kinds) {
    const list = allAchievements.filter((a) => a.kind === kind);
    if (list.length === 0) continue;
    const group = renderAchievementCollapsibleGroupV2(container, achievementV2GroupLabel(kind), {
      key: `global_${kind}`,
      defaultCollapsed: false
    });
    for (const a of list) {
      renderAchievementCardV2(group, a, unlockedById[a.id]);
    }
  }

  const legacy = Object.entries(unlockedById)
    .filter(([id]) => !knownIds.has(id))
    .map(([id, ts]) => ({ id, ts }))
    .sort((a, b) => b.ts - a.ts);

  if (legacy.length) {
    const group = renderAchievementCollapsibleGroupV2(container, 'Legacy (versiones anteriores)', {
      key: 'global_legacy',
      defaultCollapsed: true
    });

    for (const x of legacy) {
      renderAchievementCardV2(
        group,
        {
          id: x.id,
          title: `Legacy: ${x.id}`,
          desc: 'Logro de una versión anterior (se conserva por historial).',
          kind: 'legacy'
        },
        x.ts
      );
    }
  }
}

function renderSubjectAchievementsGridV2(container, subject) {
  if (!container) return;
  if (!subject) return;

  const unlockedById = subject?.meta?.achievements ?? {};
  const defs = subjectAchievementDefinitionsV2(subject);

  const progress = defs.filter((d) => d.kind === 'progress');
  const categories = defs.filter((d) => d.kind === 'category');
  const custom = defs.filter((d) => d.kind === 'custom');

  if (progress.length) {
    const group = renderAchievementCollapsibleGroupV2(container, 'Progreso de esta materia', {
      key: `subj_${subject.id}_group_progress`,
      defaultCollapsed: false
    });
    for (const a of progress) renderAchievementCardV2(group, a, unlockedById[a.id]);
  }

  if (categories.length) {
    const group = renderAchievementCollapsibleGroupV2(container, 'Temas completados', {
      key: `subj_${subject.id}_group_categories`,
      defaultCollapsed: true
    });
    for (const a of categories) renderAchievementCardV2(group, a, unlockedById[a.id]);
  }

  if (custom.length) {
    const group = renderAchievementCollapsibleGroupV2(container, 'Personalizados', {
      key: `subj_${subject.id}_group_custom`,
      defaultCollapsed: true
    });
    for (const a of custom) renderAchievementCardV2(group, a, unlockedById[a.id]);
  }
}

export function renderAchievementsV2() {
  const achievementsContainer = document.getElementById('achievementsContainer');
  if (!achievementsContainer) return;
  achievementsContainer.innerHTML = '';

  const appState = getAppState();
  const currentSubject = getCurrentSubject();
  if (!appState || !currentSubject) return;

  renderSubjectAchievementsGridV2(achievementsContainer, currentSubject);
}

export function ensureHomeAchievementsPanelV2() {
  const homeView = document.getElementById('homeView');
  if (!homeView) return;

  const panelId = 'homeAchievementsPanel';
  let panel = document.getElementById(panelId);

  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = panelId;
    panel.innerHTML = `
            <div class="panel-header">
                <div>
                    <h2 class="panel-title">Logros</h2>
                    <div class="panel-subtitle">Generales y por materia</div>
                </div>
                <button class="btn btn-secondary btn-small" id="homeAchievementsToggleBtn" type="button">Mostrar</button>
            </div>
            <div class="stats-grid" id="homeAchievementsSummary"></div>
            <div class="achievements-grid" id="homeAchievementsContainer" hidden></div>
        `;

    const insertBeforeEl = document.getElementById('recentSubjectsGrid')?.closest('.recent-subjects') ?? null;
    if (insertBeforeEl && insertBeforeEl.parentNode) {
      insertBeforeEl.parentNode.insertBefore(panel, insertBeforeEl);
    } else {
      homeView.querySelector('.home-container')?.appendChild(panel);
    }
  }

  const toggleBtn = document.getElementById('homeAchievementsToggleBtn');
  const listEl = document.getElementById('homeAchievementsContainer');
  if (toggleBtn && listEl && !toggleBtn.dataset.bound) {
    toggleBtn.dataset.bound = '1';
    toggleBtn.addEventListener('click', () => {
      listEl.hidden = !listEl.hidden;
      toggleBtn.textContent = listEl.hidden ? 'Mostrar' : 'Ocultar';
    });
  }

  const actionsGrid = homeView.querySelector('.actions-grid');
  if (actionsGrid && !document.getElementById('quickViewAchievements')) {
    const btn = document.createElement('button');
    btn.className = 'action-card';
    btn.id = 'quickViewAchievements';
    btn.type = 'button';
    btn.innerHTML = `
            <div class="action-icon">🏆</div>
            <div class="action-title">Ver Logros</div>
            <div class="action-desc">Revisa logros generales y por materia</div>
        `;
    actionsGrid.appendChild(btn);
  }

  const quickBtn = document.getElementById('quickViewAchievements');
  if (quickBtn && !quickBtn.dataset.bound) {
    quickBtn.dataset.bound = '1';
    quickBtn.addEventListener('click', () => {
      const list = document.getElementById('homeAchievementsContainer');
      const btn = document.getElementById('homeAchievementsToggleBtn');
      if (list) list.hidden = false;
      if (btn) btn.textContent = 'Ocultar';
      try {
        document.getElementById(panelId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        // ignore
      }
    });
  }

  const totalAchievementsEl = document.getElementById('totalAchievements');
  const statClickTarget = totalAchievementsEl?.closest('.stat-card') ?? totalAchievementsEl;
  if (statClickTarget && !statClickTarget.dataset.bound) {
    statClickTarget.dataset.bound = '1';
    statClickTarget.style.cursor = 'pointer';
    statClickTarget.title = 'Ver logros';
    statClickTarget.addEventListener('click', () => {
      const list = document.getElementById('homeAchievementsContainer');
      const btn = document.getElementById('homeAchievementsToggleBtn');
      if (list) list.hidden = false;
      if (btn) btn.textContent = 'Ocultar';
      try {
        document.getElementById(panelId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        // ignore
      }
    });
  }
}

export function renderHomeAchievementsV2() {
  const summaryEl = document.getElementById('homeAchievementsSummary');
  const listEl = document.getElementById('homeAchievementsContainer');
  if (!summaryEl || !listEl) return;

  const appState = getAppState();
  if (!appState) {
    summaryEl.innerHTML = '';
    listEl.innerHTML = '';
    return;
  }

  const unlockedGlobal = appState.globalMeta.achievements ?? {};
  const globalDefs = globalAchievementDefinitionsV2();
  const totalGlobalCount = globalDefs.length;
  const unlockedGlobalCount = Object.keys(unlockedGlobal).length;

  const perSubject = [];
  const titleById = new Map();
  for (const a of globalDefs) titleById.set(a.id, a.title);

  for (const subject of appState.subjects ?? []) {
    const defs = subjectAchievementDefinitionsV2(subject);
    for (const a of defs) titleById.set(a.id, a.title);
    if (!defs.length) continue;
    const unlocked = Object.keys(subject?.meta?.achievements ?? {}).length;
    perSubject.push({ subject, total: defs.length, unlocked });
  }

  const recentAll = [];
  for (const [id, ts] of Object.entries(unlockedGlobal)) {
    const title = titleById.get(id);
    if (title) recentAll.push({ title, ts });
  }
  for (const subject of appState.subjects ?? []) {
    for (const [id, ts] of Object.entries(subject?.meta?.achievements ?? {})) {
      const title = titleById.get(id);
      if (title) recentAll.push({ title, ts });
    }
  }

  const recent = recentAll.sort((a, b) => b.ts - a.ts).slice(0, 3);

  summaryEl.innerHTML = `
        <div class="card">
            <div class="card-title">Generales</div>
            <div class="card-desc">${unlockedGlobalCount} / ${totalGlobalCount} desbloqueados</div>
        </div>
        ${perSubject
          .map(
            (x) => `
            <div class="card">
                <div class="card-title">${escapeHtml(x.subject.icon ? `${x.subject.icon} ` : '')}${escapeHtml(x.subject.name ?? 'Materia')}</div>
                <div class="card-desc">${x.unlocked} / ${x.total} logros de esta materia</div>
            </div>
        `
          )
          .join('')}
        ${
          recent.length
            ? `
            <div class="card">
                <div class="card-title">Últimos desbloqueados</div>
                <div class="card-desc">
                    ${recent.map((r) => `${escapeHtml(r.title)} · ${escapeHtml(formatDateTime(r.ts))}`).join('<br>')}
                </div>
            </div>
        `
            : ''
        }
    `;

  listEl.innerHTML = '';
  renderGlobalAchievementsGridV2(listEl);

  for (const subject of appState.subjects ?? []) {
    const defs = subjectAchievementDefinitionsV2(subject);
    if (!defs.length) continue;

    const subjectGroup = renderAchievementCollapsibleGroupV2(
      listEl,
      `Materia: ${subject.icon ? `${subject.icon} ` : ''}${subject.name ?? 'Materia'}`,
      { key: `home_subj_${subject.id}`, defaultCollapsed: true }
    );
    renderSubjectAchievementsGridV2(subjectGroup, subject);
  }
}

export function ensureHomeStatsPanelV2() {
  const homeView = document.getElementById('homeView');
  if (!homeView) return;

  const panelId = 'homeStatsPanel';
  let panel = document.getElementById(panelId);

  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = panelId;
    panel.innerHTML = `
            <div class="panel-header">
                <div>
                    <h2 class="panel-title">Estadísticas Globales</h2>
                    <div class="panel-subtitle">Resumen total y por materia</div>
                </div>
                <button class="btn btn-secondary btn-small" id="homeStatsToggleBtn" type="button">Mostrar</button>
            </div>
            <div class="stats-grid" id="homeStatsSummary"></div>
            <div class="stats-grid" id="homeStatsDetails" hidden></div>
        `;

    const insertBeforeEl =
      document.getElementById('homeAchievementsPanel') ??
      (document.getElementById('recentSubjectsGrid')?.closest('.recent-subjects') ?? null);
    if (insertBeforeEl && insertBeforeEl.parentNode) {
      insertBeforeEl.parentNode.insertBefore(panel, insertBeforeEl);
    } else {
      homeView.querySelector('.home-container')?.appendChild(panel);
    }
  }

  const toggleBtn = document.getElementById('homeStatsToggleBtn');
  const detailsEl = document.getElementById('homeStatsDetails');
  if (toggleBtn && detailsEl && !toggleBtn.dataset.bound) {
    toggleBtn.dataset.bound = '1';
    toggleBtn.addEventListener('click', () => {
      detailsEl.hidden = !detailsEl.hidden;
      toggleBtn.textContent = detailsEl.hidden ? 'Mostrar' : 'Ocultar';
    });
  }
}

export function renderHomeStatsV2() {
  const summaryEl = document.getElementById('homeStatsSummary');
  const detailsEl = document.getElementById('homeStatsDetails');
  if (!summaryEl || !detailsEl) return;

  const appState = getAppState();
  if (!appState) {
    summaryEl.innerHTML = '';
    detailsEl.innerHTML = '';
    return;
  }

  const totalFocus = appState.globalMeta.totalFocusSeconds ?? 0;
  const totalSessions = appState.globalMeta.sessionsCount ?? 0;
  const longest = appState.globalMeta.longestSessionSeconds ?? 0;
  const globalProgress = calculateGlobalProgress();

  summaryEl.innerHTML = `
        <div class="card">
            <div class="card-title">Tiempo total</div>
            <div class="card-desc">${escapeHtml(prettyTime(totalFocus))}</div>
        </div>
        <div class="card">
            <div class="card-title">Sesiones</div>
            <div class="card-desc">${escapeHtml(String(totalSessions))}</div>
        </div>
        <div class="card">
            <div class="card-title">Mejor sesión</div>
            <div class="card-desc">${escapeHtml(prettyTime(longest))}</div>
        </div>
        <div class="card">
            <div class="card-title">Progreso global</div>
            <div class="card-desc">${escapeHtml(String(globalProgress))}%</div>
        </div>
    `;

  const subjects = [...(appState.subjects ?? [])].sort((a, b) => calculateSubjectProgress(b) - calculateSubjectProgress(a));
  detailsEl.innerHTML = subjects
    .map((subject) => {
      const progress = calculateSubjectProgress(subject);
      const time = prettyTime(subject.meta?.totalFocusSeconds ?? 0);
      const sessions = String(subject.meta?.sessionsCount ?? 0);
      return `
            <div class="card">
                <div class="card-title">${escapeHtml(subject.icon ? `${subject.icon} ` : '')}${escapeHtml(subject.name ?? 'Materia')}</div>
                <div class="card-desc">Progreso: ${escapeHtml(String(progress))}% · Tiempo: ${escapeHtml(time)} · Sesiones: ${escapeHtml(sessions)}</div>
            </div>
        `;
    })
    .join('');
}
