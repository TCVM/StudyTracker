import {
  addSubjectDraftId,
  createDraftCategory,
  createDraftTopic,
  draftLastDescendantIndex,
  escAttr,
  findTopicIndexById
} from './drafts.mjs';
import { showConfirmModalV2 } from '../../ui/confirm-modal.mjs';
import { escapeHtml, showNotification } from '../../../utils/helpers.js';
import { getAppState, getCurrentSubject } from '../../core/state.mjs';
import { subjectAchievementDefinitionsV2 } from '../achievements/definitions.mjs';
import { checkSubjectAchievementsV2 } from '../achievements/core.mjs';
import { renderAchievementsV2 } from '../achievements/ui.mjs';
import { renderHomePage } from '../../ui/home.mjs';
import { normalizeBannerUrl } from '../../shared/core.mjs';
import { renderAll, renderSubjectList } from '../../ui/render.mjs';
import { createSubject, saveData } from '../../core/storage.mjs';
import { getEditSubjectDraftRaw, getEditingSubjectId, setEditingSubjectId, setEditSubjectDraftRaw } from '../../core/ui-state.mjs';

function byId(id) {
  return document.getElementById(id);
}

export function setEditSubjectModalTab(tab) {
  const setActive = (btn, on) => {
    if (!btn) return;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  };

  const show = (el, on) => {
    if (!el) return;
    el.hidden = !on;
  };

  const editSubjectTabDetails = byId('editSubjectTabDetails');
  const editSubjectTabStructure = byId('editSubjectTabStructure');
  const editSubjectTabAchievements = byId('editSubjectTabAchievements');
  const editSubjectTabReset = byId('editSubjectTabReset');

  const editSubjectDetailsSection = byId('editSubjectDetailsSection');
  const editSubjectStructureSection = byId('editSubjectStructureSection');
  const editSubjectAchievementsSection = byId('editSubjectAchievementsSection');
  const editSubjectResetSection = byId('editSubjectResetSection');

  const isDetails = tab === 'details';
  const isStructure = tab === 'structure';
  const isAchievements = tab === 'achievements';
  const isReset = tab === 'reset';

  setActive(editSubjectTabDetails, isDetails);
  setActive(editSubjectTabStructure, isStructure);
  setActive(editSubjectTabAchievements, isAchievements);
  setActive(editSubjectTabReset, isReset);

  show(editSubjectDetailsSection, isDetails);
  show(editSubjectStructureSection, isStructure);
  show(editSubjectAchievementsSection, isAchievements);
  show(editSubjectResetSection, isReset);
}

export function ensureEditSubjectDraft() {
  if (!getEditSubjectDraftRaw()) {
    setEditSubjectDraftRaw({ categories: [createDraftCategory()] });
  }
  const d = getEditSubjectDraftRaw();
  if (!Array.isArray(d.categories)) d.categories = [];
}

export function getEditSubjectDraft() {
  ensureEditSubjectDraft();
  return getEditSubjectDraftRaw();
}

function editDraftFromSubject(subject) {
  const draft = { categories: [] };
  for (const cat of subject?.categories ?? []) {
    const topics = Array.isArray(cat.topics) ? cat.topics : [];
    draft.categories.push({
      id: Number(cat.id) || addSubjectDraftId(),
      name: cat.name ?? '',
      icon: cat.icon ?? '📍',
      collapsed: false,
      topics: topics.map((t, idx) => ({
        id: addSubjectDraftId(),
        name: t.name ?? '',
        depth: Math.max(1, Math.min(20, Number(t.level) || 1)),
        collapsed: false,
        sourceIndex: idx
      }))
    });
  }

  if (draft.categories.length === 0) draft.categories.push(createDraftCategory());
  return draft;
}

function findEditDraftCategory(catId) {
  ensureEditSubjectDraft();
  return getEditSubjectDraftRaw().categories.find((c) => c.id === catId) || null;
}

function findEditTopicIndexById(cat, topicId) {
  return findTopicIndexById(cat, topicId);
}

export function renderEditSubjectBuilder() {
  ensureEditSubjectDraft();
  const editSubjectCategoriesBuilder = byId('editSubjectCategoriesBuilder');
  if (!editSubjectCategoriesBuilder) return;

  if (getEditSubjectDraftRaw().categories.length === 0) {
    getEditSubjectDraftRaw().categories.push(createDraftCategory());
  }

  editSubjectCategoriesBuilder.innerHTML = getEditSubjectDraftRaw().categories.map((cat) => {
    const catChevron = cat.collapsed ? '▸' : '▾';

    const topics = Array.isArray(cat.topics) ? cat.topics : [];
    const htmlRows = [];
    const collapsedStack = [];

    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      while (collapsedStack.length && t.depth <= collapsedStack[collapsedStack.length - 1]) {
        collapsedStack.pop();
      }

      const hidden = collapsedStack.length > 0;
      const hasChildren = i + 1 < topics.length && topics[i + 1].depth > t.depth;
      if (t.collapsed && hasChildren) collapsedStack.push(t.depth);

      const collapseBtn = hasChildren
        ? `<button class="topic-collapse" type="button" data-action="topic_toggle" title="Desplegar / Cerrar">${t.collapsed ? '▸' : '▾'}</button>`
        : `<button class="topic-collapse placeholder" type="button" disabled title="Sin subtemas">•</button>`;

      const inputIndent = (Math.max(1, t.depth) - 1) * 16;

      htmlRows.push(`
        <div class="topic-row ${hidden ? 'is-hidden' : ''}" data-topic-id="${escAttr(t.id)}">
          ${collapseBtn}
          <input class="topic-input" data-field="topic_name" type="text" placeholder="Subtema"
            style="margin-left:${inputIndent}px" value="${escAttr(t.name ?? '')}" />
          <div class="topic-actions">
            <button class="topic-action" type="button" data-action="topic_add_child" title="Agregar hijo">+</button>
            <button class="topic-action" type="button" data-action="topic_add_sibling" title="Agregar hermano">≈</button>
            <button class="topic-action" type="button" data-action="topic_delete" title="Eliminar">×</button>
          </div>
        </div>
      `);
    }

    const topicsHtml = htmlRows.join('');

    return `
      <div class="category-editor" data-cat-id="${escAttr(cat.id)}">
        <div class="category-editor-header">
          <button class="mini-btn" type="button" data-action="cat_toggle" title="Desplegar / Cerrar">${catChevron}</button>
          <input class="mini-input" data-field="cat_icon" type="text" placeholder="📍" value="${escAttr(cat.icon ?? '')}" />
          <input class="mini-input" data-field="cat_name" type="text" placeholder="Tema (ej: Álgebra)" value="${escAttr(cat.name ?? '')}" />
          <button class="mini-btn" type="button" data-action="cat_delete" title="Eliminar tema">—</button>
        </div>
        <div class="category-editor-body" ${cat.collapsed ? 'hidden' : ''}>
          <div class="topics-editor-toolbar">
            <div class="topics-editor-title">Subtemas</div>
            <button class="btn btn-secondary btn-small" type="button" data-action="topic_add_root">+ Subtema</button>
          </div>
          <div class="topics-list-editor">${topicsHtml}</div>
        </div>
      </div>
    `;
  }).join('');

  if (!editSubjectCategoriesBuilder.dataset.bound) {
    editSubjectCategoriesBuilder.dataset.bound = '1';

    editSubjectCategoriesBuilder.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const catEl = btn.closest('.category-editor');
      const catId = catEl ? Number(catEl.dataset.catId) : null;
      const cat = catId ? findEditDraftCategory(catId) : null;

      if (action.startsWith('cat_')) {
        if (!cat) return;
        if (action === 'cat_toggle') {
          cat.collapsed = !cat.collapsed;
          renderEditSubjectBuilder();
        } else if (action === 'cat_delete') {
          const draft = getEditSubjectDraftRaw();
          draft.categories = draft.categories.filter((c) => c.id !== cat.id);
          if (draft.categories.length === 0) draft.categories.push(createDraftCategory());
          renderEditSubjectBuilder();
        }
        return;
      }

      if (!cat) return;
      if (!Array.isArray(cat.topics)) cat.topics = [];

      const row = btn.closest('.topic-row');
      const topicId = row ? Number(row.dataset.topicId) : null;
      const topicIndex = topicId ? findEditTopicIndexById(cat, topicId) : -1;

      if (action === 'topic_add_root') {
        cat.topics.push(createDraftTopic(1));
        renderEditSubjectBuilder();
        return;
      }

      if (topicIndex < 0) return;

      const topics = cat.topics;
      const t = topics[topicIndex];
      const lastDesc = draftLastDescendantIndex(topics, topicIndex);
      const insertAt = lastDesc + 1;

      if (action === 'topic_toggle') {
        const hasChildren = topicIndex + 1 < topics.length && topics[topicIndex + 1].depth > t.depth;
        if (!hasChildren) return;
        t.collapsed = !t.collapsed;
        renderEditSubjectBuilder();
        return;
      }

      if (action === 'topic_add_child') {
        t.collapsed = false;
        topics.splice(insertAt, 0, createDraftTopic(t.depth + 1));
        renderEditSubjectBuilder();
        return;
      }

      if (action === 'topic_add_sibling') {
        topics.splice(insertAt, 0, createDraftTopic(t.depth));
        renderEditSubjectBuilder();
        return;
      }

      if (action === 'topic_delete') {
        const start = topicIndex;
        const end = draftLastDescendantIndex(topics, topicIndex);
        topics.splice(start, (end - start) + 1);
        if (topics.length === 0) topics.push(createDraftTopic(1));
        renderEditSubjectBuilder();
      }
    });

    editSubjectCategoriesBuilder.addEventListener('input', (e) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement)) return;

      const field = el.dataset.field;
      if (!field) return;

      const catEl = el.closest('.category-editor');
      const catId = catEl ? Number(catEl.dataset.catId) : null;
      const cat = catId ? findEditDraftCategory(catId) : null;
      if (!cat) return;

      if (field === 'cat_name') {
        cat.name = el.value;
        return;
      }

      if (field === 'cat_icon') {
        cat.icon = el.value;
        return;
      }

      if (field === 'topic_name') {
        const row = el.closest('.topic-row');
        const topicId = row ? Number(row.dataset.topicId) : null;
        const idx = topicId ? findEditTopicIndexById(cat, topicId) : -1;
        if (idx >= 0) cat.topics[idx].name = el.value;
      }
    });
  }
}

export function renderCustomAchievementsEditor(subject) {
  const customAchievementsList = byId('customAchievementsList');
  if (!customAchievementsList) return;
  const list = Array.isArray(subject?.meta?.customAchievements) ? subject.meta.customAchievements : [];

  if (list.length === 0) {
    customAchievementsList.innerHTML = '<div class="builder-subtitle">No hay logros personalizados todavía.</div>';
    return;
  }

  const metaFor = (a) => {
    if (a.type === 'pct') return `📊 ${a.value}% completado`;
    if (a.type === 'focus_minutes') return `⏱️ ${a.value} min en esta materia`;
    if (a.type === 'category_complete') {
      const cat = (subject.categories ?? []).find((c) => c.id === a.categoryId);
      return `✓ Completar tema: ${cat?.name ?? 'Tema'}`;
    }
    return 'Personalizado';
  };

  const esc = (x) => escapeHtml(String(x));

  customAchievementsList.innerHTML = list.map((a) => `
        <div class="custom-ach-item" data-custom-ach-id="${escAttr(a.id)}">
            <div class="custom-ach-main">
                <div class="custom-ach-title">🏆 ${esc(a.title ?? 'Logro')}</div>
                <div class="custom-ach-meta">${esc(metaFor(a))}</div>
            </div>
            <button class="topic-action" type="button" data-action="custom_delete" title="Eliminar logro">🗑️</button>
        </div>
    `).join('');

  if (!customAchievementsList.dataset.bound) {
    customAchievementsList.dataset.bound = '1';
    customAchievementsList.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action="custom_delete"]');
      if (!btn) return;

      const subject = getCurrentSubject();
      if (!subject) return;

      const item = btn.closest('.custom-ach-item');
      const id = item ? item.dataset.customAchId : null;
      if (!id) return;

      const customList = Array.isArray(subject?.meta?.customAchievements) ? subject.meta.customAchievements : [];
      const ach = customList.find((x) => x.id === id);
      if (!ach) return;

      const ok = await showConfirmModalV2({
        title: '🗑️ Eliminar logro personalizado',
        text: `Se eliminará el logro "${ach.title ?? 'Logro'}" y su estado de desbloqueo. No afecta logros automáticos.`,
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        fallbackText: '¿Eliminar logro?'
      });
      if (!ok) return;

      subject.meta.customAchievements = customList.filter((x) => x.id !== id);
      if (subject?.meta?.achievements) delete subject.meta.achievements[id];
      saveData(true);
      renderCustomAchievementsEditor(subject);
      renderAchievementsV2();
      renderHomePage();
    });
  }
}

export function syncCustomAchievementTypeUi(subject) {
  const customAchType = byId('customAchType');
  const customAchCategory = byId('customAchCategory');
  const customAchValueRow = byId('customAchValueRow');
  const customAchCategoryRow = byId('customAchCategoryRow');
  if (!customAchType || !customAchCategory || !customAchValueRow || !customAchCategoryRow) return;
  const type = customAchType.value;

  customAchValueRow.hidden = type === 'category_complete';
  customAchCategoryRow.hidden = type !== 'category_complete';

  if (type === 'category_complete') {
    const cats = subject?.categories ?? [];
    const esc = (x) => escapeHtml(String(x));
    customAchCategory.innerHTML = cats.map((c) => `<option value="${String(c.id)}">${esc(c.icon ? `${c.icon} ` : '')}${esc(c.name ?? 'Tema')}</option>`).join('');
  }
}

export function showEditSubjectModal() {
  const editSubjectModal = byId('editSubjectModal');
  const subject = getCurrentSubject();
  if (!subject || !editSubjectModal) {
    showNotification('Selecciona una materia primero');
    return;
  }

  setEditingSubjectId(subject.id);
  setEditSubjectDraftRaw(editDraftFromSubject(subject));

  const editSubjectNameInput = byId('editSubjectName');
  const editSubjectIconInput = byId('editSubjectIcon');
  const editSubjectColorInput = byId('editSubjectColor');
  const editSubjectBannerUrlInput = byId('editSubjectBannerUrl');

  if (editSubjectNameInput) editSubjectNameInput.value = subject.name ?? '';
  if (editSubjectIconInput) editSubjectIconInput.value = subject.icon ?? '📚';
  if (editSubjectColorInput) editSubjectColorInput.value = subject.color ?? '#667eea';
  if (editSubjectBannerUrlInput) editSubjectBannerUrlInput.value = subject.bannerUrl ?? '';

  setEditSubjectModalTab('details');
  renderEditSubjectBuilder();
  renderCustomAchievementsEditor(subject);
  syncCustomAchievementTypeUi(subject);

  const customAchTitle = byId('customAchTitle');
  const customAchDesc = byId('customAchDesc');
  const customAchValue = byId('customAchValue');
  const customAchStatus = byId('customAchStatus');
  if (customAchTitle) customAchTitle.value = '';
  if (customAchDesc) customAchDesc.value = '';
  if (customAchValue) customAchValue.value = '';
  if (customAchStatus) customAchStatus.textContent = '';

  editSubjectModal.classList.add('active');
}

export function hideEditSubjectModal() {
  const editSubjectModal = byId('editSubjectModal');
  if (!editSubjectModal) return;
  editSubjectModal.classList.remove('active');
  setEditingSubjectId(null);
  setEditSubjectDraftRaw(null);
}

function pruneSubjectAchievementsToDefinitions(subject) {
  if (!subject?.meta?.achievements) return;
  const defs = subjectAchievementDefinitionsV2(subject) ?? [];
  const allowed = new Set(defs.map((d) => d.id));

  for (const id of Object.keys(subject.meta.achievements)) {
    if (!allowed.has(id)) delete subject.meta.achievements[id];
  }
}

function applyEditDraftToSubject(subject) {
  if (!subject) return;
  ensureEditSubjectDraft();

  const originalCategoriesById = new Map((subject.categories ?? []).map((c) => [Number(c.id), c]));

  const newCategories = [];
  for (const dc of getEditSubjectDraftRaw()?.categories ?? []) {
    const name = String(dc.name ?? '').trim() || 'Tema';
    const icon = String(dc.icon ?? '').trim() || '📍';
    const catId = Number(dc.id) || addSubjectDraftId();

    const originalCat = originalCategoriesById.get(catId) ?? null;
    const originalTopics = Array.isArray(originalCat?.topics) ? originalCat.topics : [];

    const draftTopics = Array.isArray(dc.topics) ? dc.topics : [];
    const topics = draftTopics
      .filter((t) => String(t.name ?? '').trim())
      .map((t) => {
        const depth = Math.max(1, Math.min(20, Number(t.depth) || 1));
        const src = (t.sourceIndex != null) ? originalTopics[t.sourceIndex] : null;
        const obj = src ? src : { name: '', level: 1, completed: false, completedAt: null, reviews: [] };
        obj.name = String(t.name ?? '').trim();
        obj.level = depth;
        if (!Array.isArray(obj.reviews)) obj.reviews = [];
        if (obj.completed && obj.completedAt == null) obj.completedAt = Date.now();
        return obj;
      });

    const catObj = originalCat ? { ...originalCat } : { id: catId };
    catObj.id = catId;
    catObj.name = name;
    catObj.icon = icon;
    catObj.topics = topics;
    newCategories.push(catObj);
  }

  subject.categories = newCategories;
  pruneSubjectAchievementsToDefinitions(subject);
}

export function editingSubjectRef() {
  const appState = getAppState();
  if (!appState) return null;
  const currentSubject = getCurrentSubject();
  const editingId = getEditingSubjectId();
  if (editingId == null) return currentSubject;
  return appState.subjects.find((s) => s.id === editingId) ?? currentSubject;
}

export function saveEditedSubject() {
  const subject = editingSubjectRef();
  if (!subject) return false;

  const editSubjectNameInput = byId('editSubjectName');
  const editSubjectIconInput = byId('editSubjectIcon');
  const editSubjectColorInput = byId('editSubjectColor');
  const editSubjectBannerUrlInput = byId('editSubjectBannerUrl');

  const name = String(editSubjectNameInput?.value ?? '').trim();
  if (!name) {
    showNotification('El nombre es obligatorio');
    return false;
  }

  const icon = String(editSubjectIconInput?.value ?? '📚').trim() || '📚';
  const color = String(editSubjectColorInput?.value ?? subject.color ?? '#667eea');
  const bannerUrl = normalizeBannerUrl(editSubjectBannerUrlInput?.value);

  subject.name = name;
  subject.icon = icon;
  subject.color = color;
  subject.bannerUrl = bannerUrl;

  applyEditDraftToSubject(subject);
  checkSubjectAchievementsV2(subject, { silent: true });

  saveData(true);
  renderSubjectList();
  renderAll();

  return true;
}

function resetSubjectProgress(subject) {
  if (!subject) return;

  const preserved = {
    id: subject.id,
    name: subject.name,
    icon: subject.icon,
    color: subject.color,
    bannerUrl: subject.bannerUrl ?? null,
    categories: subject.categories,
    difficulty: subject?.meta?.difficulty ?? 'normal',
    pomodoro: subject?.meta?.pomodoro ?? null,
    alarm: subject?.meta?.alarm ?? null,
    customAchievements: Array.isArray(subject?.meta?.customAchievements) ? subject.meta.customAchievements : []
  };

  for (const category of preserved.categories ?? []) {
    for (const topic of category.topics ?? []) {
      topic.completed = false;
      topic.completedAt = null;
      topic.reviews = [];
    }
  }

  const freshMeta = createSubject(preserved.id, preserved.name, preserved.icon, preserved.color)?.meta;
  if (!freshMeta) return;
  freshMeta.difficulty = preserved.difficulty;
  freshMeta.customAchievements = preserved.customAchievements;
  if (preserved.pomodoro && typeof preserved.pomodoro === 'object') freshMeta.pomodoro = preserved.pomodoro;
  if (preserved.alarm && typeof preserved.alarm === 'object') freshMeta.alarm = preserved.alarm;

  subject.meta = freshMeta;
  subject.bannerUrl = preserved.bannerUrl;
  subject.categories = preserved.categories ?? [];
}

export async function resetCurrentSubject() {
  const subject = getCurrentSubject();
  if (!subject) return;
  const name = subject.name ?? 'esta materia';

  const ok = await showConfirmModalV2({
    title: '♻️ Reiniciar esta materia',
    text: `Esto borra el progreso de "${name}" (temas completados, sesiones, XP y logros de esta materia). La estructura (temas/subtemas) se mantiene.`,
    confirmText: 'Sí, reiniciar materia',
    cancelText: 'Cancelar',
    fallbackText: `¿Reiniciar "${name}"?`
  });
  if (!ok) return;

  resetSubjectProgress(subject);
  saveData(true);
  renderAll();
  showNotification(`Materia "${name}" reiniciada.`);
}
