import { showConfirmModalV2 } from '../../ui/confirm-modal.mjs';
import { escapeHtml, prettyTime, showNotification, todayKey } from '../../../utils/helpers.js';
import { getAppState, getCurrentSubject } from '../../core/state.mjs';
import { SKILLS } from '../../core/constants.mjs';
import { saveData } from '../../core/storage.mjs';
import { isTopicReviewDue } from '../xp/xp.mjs';
import { updateXpUi } from '../timer/timer.mjs';

function byId(id) {
  return document.getElementById(id);
}

export function ensureSubjectNotes(subject) {
  if (!subject || typeof subject !== 'object') return;
  if (!subject.notes || typeof subject.notes !== 'object') subject.notes = {};

  if (typeof subject.notes.text !== 'string') subject.notes.text = '';
  if (!Array.isArray(subject.notes.items)) subject.notes.items = [];
  if (!Array.isArray(subject.notes.links)) subject.notes.links = [];

  const now = Date.now();

  // Migrate legacy single-text notes to multiple items.
  if (subject.notes.items.length === 0 && (subject.notes.text || subject.notes.text === '')) {
    subject.notes.items.push({
      id: `n_${now}`,
      title: 'General',
      content: String(subject.notes.text ?? ''),
      createdAt: now,
      updatedAt: now
    });
  }

  subject.notes.items = subject.notes.items
    .filter((n) => n && typeof n === 'object')
    .map((n, idx) => {
      const id = String(n.id ?? `n_${now}_${idx}`);
      const title = String(n.title ?? 'Nota').trim() || 'Nota';
      const content = String(n.content ?? n.text ?? '');
      const createdAt = Number.isFinite(Number(n.createdAt)) ? Number(n.createdAt) : now;
      const updatedAt = Number.isFinite(Number(n.updatedAt)) ? Number(n.updatedAt) : createdAt;
      return { id, title, content, createdAt, updatedAt };
    });

  if (!subject.notes.items.length) {
    subject.notes.items.push({
      id: `n_${now}`,
      title: 'General',
      content: '',
      createdAt: now,
      updatedAt: now
    });
  }

  const activeId = String(subject.notes.activeId ?? '');
  const hasActive = activeId && subject.notes.items.some((n) => n.id === activeId);
  if (!hasActive) {
    subject.notes.activeId = subject.notes.items[0].id;
  }

  subject.notes.links = subject.notes.links
    .filter((l) => l && typeof l === 'object' && typeof l.url === 'string')
    .map((l) => ({
      title: typeof l.title === 'string' ? l.title : '',
      url: String(l.url)
    }));

  // Keep legacy "text" in sync for older imports/exports.
  const active = subject.notes.items.find((n) => n.id === subject.notes.activeId) ?? subject.notes.items[0];
  subject.notes.text = String(active?.content ?? '');
}

export function getActiveNote(subject) {
  if (!subject) return null;
  ensureSubjectNotes(subject);
  const items = subject.notes.items;
  const activeId = String(subject.notes.activeId ?? '');
  return items.find((n) => n.id === activeId) ?? items[0] ?? null;
}

export function normalizeHttpUrl(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function renderNotes() {
  const subjectNotesText = byId('subjectNotesText');
  const subjectNotesSelect = byId('subjectNotesSelect');
  const subjectLinksList = byId('subjectLinksList');
  const subjectLinksEmpty = byId('subjectLinksEmpty');

  if (!subjectNotesText || !subjectLinksList || !subjectLinksEmpty) return;

  const subject = getCurrentSubject();
  if (!subject) {
    if (document.activeElement !== subjectNotesText) subjectNotesText.value = '';
    if (subjectNotesSelect) subjectNotesSelect.innerHTML = '';
    subjectLinksList.innerHTML = '';
    subjectLinksEmpty.hidden = false;
    return;
  }

  ensureSubjectNotes(subject);

  const items = Array.isArray(subject.notes.items) ? subject.notes.items : [];
  const activeId = String(subject.notes.activeId ?? (items[0]?.id ?? ''));
  const active = items.find((n) => n.id === activeId) ?? items[0];

  if (subjectNotesSelect) {
    subjectNotesSelect.innerHTML = '';
    for (const n of items) {
      const opt = document.createElement('option');
      opt.value = String(n.id);
      opt.textContent = String(n.title);
      subjectNotesSelect.appendChild(opt);
    }
    if (active?.id) subjectNotesSelect.value = active.id;
  }

  const nextText = String(active?.content ?? '');
  if (document.activeElement !== subjectNotesText && subjectNotesText.value !== nextText) {
    subjectNotesText.value = nextText;
  }
  if (active?.id) subjectNotesText.dataset.noteId = active.id;

  subjectLinksList.innerHTML = '';
  const links = Array.isArray(subject.notes.links) ? subject.notes.links : [];
  subjectLinksEmpty.hidden = links.length > 0;

  links.forEach((link, idx) => {
    const title = String(link.title ?? '').trim();
    const url = String(link.url ?? '').trim();
    const safeUrl = normalizeHttpUrl(url);

    const item = document.createElement('div');
    item.className = 'link-item';

    const main = document.createElement('div');
    main.className = 'link-main';

    const titleEl = document.createElement('div');
    titleEl.className = 'link-title';
    titleEl.textContent = title || (safeUrl ? safeUrl : url || 'Link');

    const urlEl = document.createElement('div');
    urlEl.className = 'link-url';
    urlEl.textContent = safeUrl ? safeUrl : url;

    main.appendChild(titleEl);
    main.appendChild(urlEl);

    const actions = document.createElement('div');
    actions.className = 'link-actions';

    if (safeUrl) {
      const a = document.createElement('a');
      a.className = 'link-open';
      a.href = safeUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Abrir';
      actions.appendChild(a);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-secondary btn-small';
    removeBtn.type = 'button';
    removeBtn.dataset.linkIndex = String(idx);
    removeBtn.textContent = 'Quitar';
    actions.appendChild(removeBtn);

    item.appendChild(main);
    item.appendChild(actions);
    subjectLinksList.appendChild(item);
  });
}

export function addNewNote() {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectNotes(subject);

  const titleRaw = prompt('Título de la nota', 'Nueva nota');
  if (titleRaw == null) return;
  const title = String(titleRaw).trim() || 'Nueva nota';

  const now = Date.now();
  const id = `n_${now}_${Math.floor(Math.random() * 100000)}`;
  subject.notes.items.unshift({ id, title, content: '', createdAt: now, updatedAt: now });
  subject.notes.activeId = id;
  subject.notes.text = '';

  saveData(true);
  renderNotes();
  try {
    byId('subjectNotesText')?.focus?.();
  } catch {
    // ignore
  }
}

export function renameActiveNote() {
  const subject = getCurrentSubject();
  if (!subject) return;
  const note = getActiveNote(subject);
  if (!note) return;

  const next = prompt('Nuevo título', note.title);
  if (next == null) return;
  const title = String(next).trim();
  if (!title) return;

  note.title = title;
  note.updatedAt = Date.now();
  saveData(true);
  renderNotes();
}

export async function deleteActiveNote() {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectNotes(subject);
  const note = getActiveNote(subject);
  if (!note) return;

  const ok = await showConfirmModalV2({
    title: 'Eliminar nota',
    text: `¿Eliminar "${note.title}"?`,
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    fallbackText: '¿Eliminar nota?'
  });
  if (!ok) return;

  subject.notes.items = subject.notes.items.filter((n) => n.id !== note.id);
  if (!subject.notes.items.length) {
    const now = Date.now();
    subject.notes.items.push({ id: `n_${now}`, title: 'General', content: '', createdAt: now, updatedAt: now });
  }
  subject.notes.activeId = subject.notes.items[0].id;
  subject.notes.text = String(subject.notes.items[0].content ?? '');

  saveData(true);
  renderNotes();
}

function buildSkillChildrenIndex(skills) {
  const byIdMap = new Map();
  const childrenByParent = new Map();

  for (const s of skills) {
    if (!s || typeof s !== 'object') continue;
    if (!s.id) continue;
    byIdMap.set(s.id, s);
  }

  for (const s of skills) {
    const parents = Array.isArray(s?.parents) ? s.parents : [];
    if (parents.length === 0) continue;
    for (const p of parents) {
      if (!childrenByParent.has(p)) childrenByParent.set(p, []);
      childrenByParent.get(p).push(s.id);
    }
  }

  return { byId: byIdMap, childrenByParent };
}

function canUnlockGlobalSkill(skill, unlockedSet) {
  if (!skill) return false;
  if (unlockedSet.has(skill.id)) return false;
  const appState = getAppState();
  if ((appState?.globalMeta?.level ?? 1) < (Number(skill.reqLevel) || 1)) return false;
  if ((appState?.globalMeta?.skillPoints ?? 0) < (Number(skill.cost) || 0)) return false;

  const parents = Array.isArray(skill.parents) ? skill.parents : [];
  return parents.every((p) => unlockedSet.has(p));
}

export function renderGlobalSkillTree() {
  const globalSkillTreeContainer = byId('globalSkillTreeContainer');
  const globalSkillMeta = byId('globalSkillMeta');
  if (!globalSkillTreeContainer || !globalSkillMeta) return;

  const appState = getAppState();
  const skills = Array.isArray(SKILLS) ? SKILLS : [];
  const level = Number(appState?.globalMeta?.level ?? 1);
  const sp = Number(appState?.globalMeta?.skillPoints ?? 0);
  const unlocked = Array.isArray(appState?.globalMeta?.unlockedSkills) ? appState.globalMeta.unlockedSkills : [];
  const unlockedSet = new Set(unlocked.map(String));

  globalSkillMeta.innerHTML = `
        <div class="meta-pill">Nivel global: ${escapeHtml(String(level))}</div>
        <div class="meta-pill">SP: ${escapeHtml(String(sp))}</div>
        <div class="meta-pill">Desbloqueadas: ${escapeHtml(String(unlockedSet.size))}/${escapeHtml(String(skills.length))}</div>
    `;

  globalSkillTreeContainer.innerHTML = '';

  const { byId: byIdMap, childrenByParent } = buildSkillChildrenIndex(skills);
  const allIds = Array.from(byIdMap.keys());

  const roots = allIds.filter((id) => {
    const s = byIdMap.get(id);
    const parents = Array.isArray(s?.parents) ? s.parents : [];
    return parents.length === 0;
  });

  const renderNode = (skillId) => {
    const skill = byIdMap.get(skillId);
    if (!skill) return null;

    const li = document.createElement('li');
    li.className = 'skill-tree-item';

    const node = document.createElement('div');
    const isUnlocked = unlockedSet.has(skill.id);
    const canUnlock = canUnlockGlobalSkill(skill, unlockedSet);
    node.className = `skill-node ${isUnlocked ? 'unlocked' : 'locked'}`;

    const header = document.createElement('div');
    header.className = 'skill-node-header';

    const title = document.createElement('div');
    title.className = 'skill-node-title';
    title.textContent = skill.title ?? skill.id;

    header.appendChild(title);

    const desc = document.createElement('div');
    desc.className = 'skill-node-desc';
    desc.textContent = skill.desc ?? '';

    const meta = document.createElement('div');
    meta.className = 'skill-node-meta';

    const tag = document.createElement('div');
    tag.className = 'skill-tag';
    tag.textContent = `Req: Lv ${Number(skill.reqLevel) || 1} · Cost: ${Number(skill.cost) || 0} SP`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-secondary btn-small';
    btn.disabled = isUnlocked || !canUnlock;
    btn.textContent = isUnlocked ? 'Desbloqueado' : 'Desbloquear';
    btn.addEventListener('click', () => unlockGlobalSkill(skill.id));

    meta.appendChild(tag);
    meta.appendChild(btn);

    node.appendChild(header);
    node.appendChild(desc);
    node.appendChild(meta);

    li.appendChild(node);

    const children = childrenByParent.get(skill.id) ?? [];
    if (children.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'skill-tree-list';
      for (const childId of children) {
        const child = renderNode(childId);
        if (child) ul.appendChild(child);
      }
      li.appendChild(ul);
    }

    return li;
  };

  const ul = document.createElement('ul');
  ul.className = 'skill-tree-list root';

  for (const rootId of roots) {
    const li = renderNode(rootId);
    if (li) ul.appendChild(li);
  }

  globalSkillTreeContainer.appendChild(ul);
}

export function unlockGlobalSkill(skillId) {
  const skills = Array.isArray(SKILLS) ? SKILLS : [];
  const skill = skills.find((s) => s.id === skillId);
  if (!skill) return;

  const appState = getAppState();
  if (!appState?.globalMeta) return;

  const unlocked = Array.isArray(appState.globalMeta.unlockedSkills) ? appState.globalMeta.unlockedSkills : [];
  const unlockedSet = new Set(unlocked.map(String));
  if (!canUnlockGlobalSkill(skill, unlockedSet)) return;

  appState.globalMeta.skillPoints -= Number(skill.cost) || 0;
  if (!Array.isArray(appState.globalMeta.unlockedSkills)) appState.globalMeta.unlockedSkills = [];
  appState.globalMeta.unlockedSkills.push(skill.id);

  saveData(true);
  renderGlobalSkillTree();
  updateXpUi();
  showNotification(`Habilidad desbloqueada: ${skill.title}`);
}

export function renderStats() {
  const statsContainer = byId('statsContainer');
  const focusTodayText = byId('focusTodayText');
  if (!statsContainer || !focusTodayText) return;

  const subject = getCurrentSubject();
  if (!subject) {
    statsContainer.innerHTML = '';
    return;
  }

  const today = todayKey() ?? '';
  const nowMs = Date.now();
  const focusTodaySeconds = subject.meta.dailyFocusSeconds?.[today] ?? 0;

  let dueReviews = 0;
  for (const category of subject.categories ?? []) {
    for (const topic of category.topics ?? []) {
      if (topic && topic.completed && isTopicReviewDue(topic, nowMs)) dueReviews += 1;
    }
  }

  const items = [
    { title: 'Tiempo total', value: prettyTime(subject.meta.totalFocusSeconds) ?? String(subject.meta.totalFocusSeconds) },
    { title: 'Hoy', value: prettyTime(focusTodaySeconds) ?? String(focusTodaySeconds) },
    { title: 'Sesiones', value: String(subject.meta.sessionsCount) },
    { title: 'Mejor sesión', value: prettyTime(subject.meta.longestSessionSeconds) ?? String(subject.meta.longestSessionSeconds) },
    { title: 'Repasos pendientes', value: String(dueReviews) }
  ];

  const esc = (x) => escapeHtml(String(x));

  statsContainer.innerHTML = items.map((x) => `
        <div class="card">
            <div class="card-title">${esc(x.title)}</div>
            <div class="card-desc">${esc(x.value)}</div>
        </div>
    `).join('');

  focusTodayText.textContent = `Hoy: ${Math.floor(focusTodaySeconds / 60)}m`;
}
