import {
  addSubjectDraftId,
  createDraftCategory,
  createDraftTopic,
  draftLastDescendantIndex,
  escAttr,
  findTopicIndexById,
  normalizeImportedTopicListToLevels
} from './drafts.mjs';
import { showConfirmModalV2 } from '../../ui/confirm-modal.mjs';
import { getAppState, getCurrentSubject, setCurrentSubject } from '../../core/state.mjs';
import { showNotification } from '../../../utils/helpers.js';
import { normalizeBannerUrl } from '../../shared/core.mjs';
import { ensureSubjectNotes } from '../notes/notes-skilltree-stats.mjs';
import { renderHomePage } from '../../ui/home.mjs';
import { renderAll, renderSubjectList } from '../../ui/render.mjs';
import { setActiveView } from '../../ui/flow.mjs';
import { createSubject, saveData } from '../../core/storage.mjs';
import { getAddSubjectDraftRaw, setAddSubjectDraftRaw } from '../../core/ui-state.mjs';

function byId(id) {
  return document.getElementById(id);
}

export function setAddSubjectModalTab(tab) {
  const isManual = tab === 'manual';

  const addSubjectTabManual = byId('addSubjectTabManual');
  const addSubjectTabImport = byId('addSubjectTabImport');
  const addSubjectManualSection = byId('addSubjectManualSection');
  const addSubjectImportSection = byId('addSubjectImportSection');

  if (addSubjectTabManual) {
    addSubjectTabManual.classList.toggle('active', isManual);
    addSubjectTabManual.setAttribute('aria-selected', isManual ? 'true' : 'false');
  }
  if (addSubjectTabImport) {
    addSubjectTabImport.classList.toggle('active', !isManual);
    addSubjectTabImport.setAttribute('aria-selected', !isManual ? 'true' : 'false');
  }

  if (addSubjectManualSection) addSubjectManualSection.hidden = !isManual;
  if (addSubjectImportSection) addSubjectImportSection.hidden = isManual;
}

export function ensureAddSubjectDraft() {
  if (!getAddSubjectDraftRaw()) {
    setAddSubjectDraftRaw({ bannerUrl: null, categories: [createDraftCategory()], notesText: '', notesLinks: [] });
  }
  const d = getAddSubjectDraftRaw();
  if (!('bannerUrl' in d)) d.bannerUrl = null;
  if (!Array.isArray(d.categories)) d.categories = [];
  if (typeof d.notesText !== 'string') d.notesText = '';
  if (!Array.isArray(d.notesLinks)) d.notesLinks = [];
}

export function getAddSubjectDraft() {
  ensureAddSubjectDraft();
  return getAddSubjectDraftRaw();
}

function findDraftCategory(catId) {
  ensureAddSubjectDraft();
  return getAddSubjectDraftRaw().categories.find((c) => c.id === catId) || null;
}

export function renderAddSubjectBuilder() {
  ensureAddSubjectDraft();
  const subjectCategoriesBuilder = byId('subjectCategoriesBuilder');
  if (!subjectCategoriesBuilder) return;

  if (getAddSubjectDraftRaw().categories.length === 0) {
    getAddSubjectDraftRaw().categories.push(createDraftCategory());
  }

  subjectCategoriesBuilder.innerHTML = getAddSubjectDraftRaw().categories.map((cat) => {
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

  if (!subjectCategoriesBuilder.dataset.bound) {
    subjectCategoriesBuilder.dataset.bound = '1';

    subjectCategoriesBuilder.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const catEl = btn.closest('.category-editor');
      const catId = catEl ? Number(catEl.dataset.catId) : null;
      const cat = catId ? findDraftCategory(catId) : null;

      if (action.startsWith('cat_')) {
        if (!cat) return;
        if (action === 'cat_toggle') {
          cat.collapsed = !cat.collapsed;
          renderAddSubjectBuilder();
        } else if (action === 'cat_delete') {
          const draft = getAddSubjectDraftRaw();
          draft.categories = draft.categories.filter((c) => c.id !== cat.id);
          if (draft.categories.length === 0) draft.categories.push(createDraftCategory());
          renderAddSubjectBuilder();
        }
        return;
      }

      if (!cat) return;
      if (!Array.isArray(cat.topics)) cat.topics = [];

      const row = btn.closest('.topic-row');
      const topicId = row ? Number(row.dataset.topicId) : null;
      const topicIndex = topicId ? findTopicIndexById(cat, topicId) : -1;

      if (action === 'topic_add_root') {
        cat.topics.push(createDraftTopic(1));
        renderAddSubjectBuilder();
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
        renderAddSubjectBuilder();
        return;
      }

      if (action === 'topic_add_child') {
        t.collapsed = false;
        topics.splice(insertAt, 0, createDraftTopic(t.depth + 1));
        renderAddSubjectBuilder();
        return;
      }

      if (action === 'topic_add_sibling') {
        topics.splice(insertAt, 0, createDraftTopic(t.depth));
        renderAddSubjectBuilder();
        return;
      }

      if (action === 'topic_delete') {
        const start = topicIndex;
        const end = draftLastDescendantIndex(topics, topicIndex);
        topics.splice(start, (end - start) + 1);
        if (topics.length === 0) topics.push(createDraftTopic(1));
        renderAddSubjectBuilder();
      }
    });

    subjectCategoriesBuilder.addEventListener('input', (e) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement)) return;

      const field = el.dataset.field;
      if (!field) return;

      const catEl = el.closest('.category-editor');
      const catId = catEl ? Number(catEl.dataset.catId) : null;
      const cat = catId ? findDraftCategory(catId) : null;
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
        const idx = topicId ? findTopicIndexById(cat, topicId) : -1;
        if (idx >= 0) cat.topics[idx].name = el.value;
      }
    });
  }
}

export function applyImportedSubjectToDraft(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('JSON inválido');
  }

  const subjectPayload = Array.isArray(payload.subjects) ? (payload.subjects[0] ?? null) : payload;
  if (!subjectPayload || typeof subjectPayload !== 'object') {
    throw new Error('No se encontró una materia en el archivo');
  }

  const name = String(subjectPayload.name ?? subjectPayload.title ?? '').trim();
  const icon = String(subjectPayload.icon ?? '📚').trim();
  const color = String(subjectPayload.color ?? '#667eea').trim();
  const bannerUrl = normalizeBannerUrl(subjectPayload.bannerUrl ?? subjectPayload.banner ?? subjectPayload.image);
  const notesItems = Array.isArray(subjectPayload?.notes?.items) ? subjectPayload.notes.items : null;
  const notesText = (() => {
    if (notesItems && notesItems.length) {
      const activeId = typeof subjectPayload?.notes?.activeId === 'string' ? subjectPayload.notes.activeId : null;
      const active = activeId ? notesItems.find((n) => n && typeof n === 'object' && String(n.id ?? '') === activeId) : null;
      const chosen = active ?? notesItems.find((n) => n && typeof n === 'object') ?? null;
      return chosen ? String(chosen.content ?? chosen.text ?? '') : '';
    }
    return (typeof subjectPayload?.notes?.text === 'string' ? subjectPayload.notes.text : '');
  })();
  const notesLinks = Array.isArray(subjectPayload?.notes?.links)
    ? subjectPayload.notes.links
      .filter((l) => l && typeof l === 'object' && typeof l.url === 'string')
      .map((l) => ({ title: String(l.title ?? ''), url: String(l.url) }))
    : [];

  const categories = Array.isArray(subjectPayload.categories) ? subjectPayload.categories : null;
  const rootTopics = subjectPayload.topics ?? null;

  const normalizedCategories = (categories ?? [{
    name: subjectPayload.categoryName ?? 'Contenido',
    icon: subjectPayload.categoryIcon ?? '📍',
    topics: rootTopics ?? []
  }]).map((c) => {
    const catName = String(c.name ?? '').trim();
    const catIcon = String(c.icon ?? '📍').trim();
    const topicLevels = normalizeImportedTopicListToLevels(c.topics ?? []);
    return { name: catName, icon: catIcon, topics: topicLevels };
  }).filter((c) => (c.name && c.topics.length) || c.topics.length);

  const subjectNameInput = byId('subjectName');
  const subjectIconInput = byId('subjectIcon');
  const subjectColorInput = byId('subjectColor');
  const subjectBannerUrlInput = byId('subjectBannerUrl');

  if (subjectNameInput) subjectNameInput.value = name || subjectNameInput.value;
  if (subjectIconInput) subjectIconInput.value = icon || subjectIconInput.value;
  if (subjectColorInput && /^#([0-9a-fA-F]{6})$/.test(color)) subjectColorInput.value = color;
  if (subjectBannerUrlInput) subjectBannerUrlInput.value = bannerUrl ?? '';

  setAddSubjectDraftRaw({
    bannerUrl,
    notesText,
    notesLinks,
    categories: normalizedCategories.map((c) => ({
      id: addSubjectDraftId(),
      name: c.name,
      icon: c.icon || '📍',
      collapsed: false,
      topics: (c.topics.length ? c.topics : [{ name: '', level: 1 }]).map((t) => ({
        id: addSubjectDraftId(),
        name: t.name,
        depth: t.level ?? 1,
        collapsed: false
      }))
    }))
  });

  const draft = getAddSubjectDraftRaw();
  if (!draft.categories.length) {
    draft.categories.push(createDraftCategory());
  }

  renderAddSubjectBuilder();
}

export function showAddSubjectModal() {
  const subjectNameInput = byId('subjectName');
  const subjectIconInput = byId('subjectIcon');
  const subjectColorInput = byId('subjectColor');
  const subjectBannerUrlInput = byId('subjectBannerUrl');
  const subjectImportFile = byId('subjectImportFile');
  const subjectImportText = byId('subjectImportText');
  const subjectImportStatus = byId('subjectImportStatus');
  const addSubjectModal = byId('addSubjectModal');

  if (subjectNameInput) subjectNameInput.value = '';
  if (subjectIconInput) subjectIconInput.value = '📚';
  if (subjectColorInput) subjectColorInput.value = '#667eea';
  if (subjectBannerUrlInput) subjectBannerUrlInput.value = '';

  setAddSubjectDraftRaw({ bannerUrl: null, categories: [createDraftCategory()], notesText: '', notesLinks: [] });
  setAddSubjectModalTab('manual');

  if (subjectImportFile) subjectImportFile.value = '';
  if (subjectImportText) subjectImportText.value = '';
  if (subjectImportStatus) subjectImportStatus.textContent = '';

  renderAddSubjectBuilder();
  addSubjectModal?.classList.add('active');
}

export function hideAddSubjectModal() {
  byId('addSubjectModal')?.classList.remove('active');
}

export function addSubject() {
  const subjectNameInput = byId('subjectName');
  const subjectIconInput = byId('subjectIcon');
  const subjectColorInput = byId('subjectColor');
  const subjectBannerUrlInput = byId('subjectBannerUrl');

  const name = String(subjectNameInput?.value ?? '').trim();
  const icon = String(subjectIconInput?.value ?? '').trim();
  const color = String(subjectColorInput?.value ?? '#667eea');
  const bannerUrl = normalizeBannerUrl(subjectBannerUrlInput?.value ?? getAddSubjectDraftRaw()?.bannerUrl);

  if (!name) {
    showNotification('El nombre de la materia es obligatorio');
    return;
  }

  const newSubject = createSubject(Date.now(), name, icon || '📚', color);
  if (!newSubject) return;
  newSubject.bannerUrl = bannerUrl;

  ensureAddSubjectDraft();
  const draft = getAddSubjectDraftRaw();
  newSubject.notes = {
    text: String(draft?.notesText ?? ''),
    items: [],
    activeId: null,
    links: Array.isArray(draft?.notesLinks) ? draft.notesLinks : []
  };
  ensureSubjectNotes(newSubject);
  const baseId = Date.now() + 100;

  const categories = (draft.categories || []).map((cat, idx) => {
    const catNameRaw = String(cat.name ?? '').trim();
    const catIcon = String(cat.icon ?? '').trim() || '📍';
    const catId = baseId + idx;

    const topics = Array.isArray(cat.topics) ? cat.topics : [];
    const normalizedTopics = topics
      .filter((t) => String(t.name ?? '').trim())
      .map((t) => ({
        name: String(t.name ?? '').trim(),
        level: Math.max(1, Math.min(20, Number(t.depth) || 1)),
        completed: false,
        completedAt: null,
        reviews: []
      }));

    if (!catNameRaw && normalizedTopics.length === 0) return null;

    const catName = catNameRaw || `Tema ${idx + 1}`;

    return {
      id: catId,
      name: catName,
      icon: catIcon,
      topics: normalizedTopics
    };
  }).filter(Boolean);

  newSubject.categories = categories.length ? categories : [];

  getAppState()?.subjects?.push?.(newSubject);
  saveData(true);
  hideAddSubjectModal();
  renderSubjectList();
  renderHomePage();
  showNotification(`Materia "${name}" creada`);
}

export async function deleteCurrentSubject() {
  const subject = getCurrentSubject();
  if (!subject) return;

  const ok = await showConfirmModalV2({
    title: '🗑️ Eliminar materia',
    text: `Esto elimina la materia "${subject.name}" y todo su progreso/logros. No se puede deshacer.`,
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    fallbackText: `¿Eliminar "${subject.name}"?`
  });
  if (!ok) return;

  const appState = getAppState();
  const index = appState?.subjects?.findIndex?.((sub) => sub.id === subject.id) ?? -1;
  if (index !== -1) {
    appState.subjects.splice(index, 1);
    setCurrentSubject(null);
    saveData(true);
    setActiveView('homeView');
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === 'homeView');
    });
    renderAll();
    showNotification('Materia eliminada');
  }
}
