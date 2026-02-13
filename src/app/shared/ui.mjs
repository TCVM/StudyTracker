import { showConfirmModalV2 } from '../ui/confirm-modal.mjs';
import { getAppState, getCurrentSubject } from '../core/state.mjs';
import { getSharedSubjects, getSharedSubjectsLoaded, getSharedSubjectsLoadError } from './state.mjs';
import { estimateSharedSubjectSize, normalizeBannerUrl } from './core.mjs';
import { escapeHtml, showNotification } from '../../utils/helpers.js';
import { ensureSubjectNotes } from '../features/notes/notes-skilltree-stats.mjs';
import { addSubjectDraftId } from '../features/subject/drafts.mjs';
import { createSubject, saveData } from '../core/storage.mjs';

function byId(id) {
  return document.getElementById(id);
}

async function renderAllAndSelectSubject(subjectId) {
  try {
    const mod = await import('../ui/render.mjs');
    mod.renderAll?.();
    mod.selectSubject?.(subjectId);
  } catch (err) {
    console.error(err);
  }
}

export function renderSubjectBanner() {
  const subjectBannerImg = byId('subjectBannerImg');
  if (!subjectBannerImg) return;

  const subject = getCurrentSubject();
  if (!subject) {
    subjectBannerImg.hidden = true;
    subjectBannerImg.removeAttribute('src');
    return;
  }

  const url = normalizeBannerUrl(subject.bannerUrl);
  if (!url) {
    subjectBannerImg.hidden = true;
    subjectBannerImg.removeAttribute('src');
    return;
  }

  subjectBannerImg.hidden = false;
  subjectBannerImg.src = url;
  subjectBannerImg.alt = `Banner de ${subject.name ?? 'materia'}`;
}

export function renderSharedSubjects() {
  const sharedSubjectsGrid = byId('sharedSubjectsGrid');
  const sharedSubjectsEmpty = byId('sharedSubjectsEmpty');
  if (!sharedSubjectsGrid) return;

  if (!getSharedSubjectsLoaded()) {
    sharedSubjectsGrid.innerHTML = '<div class="shared-empty">Cargando materias compartidas…</div>';
    if (sharedSubjectsEmpty) sharedSubjectsEmpty.hidden = true;
    return;
  }

  const list = Array.isArray(getSharedSubjects()) ? getSharedSubjects() : [];

  if (getSharedSubjectsLoadError() && list.length === 0) {
    sharedSubjectsGrid.innerHTML = '<div class="shared-empty">No se pudieron cargar las materias compartidas.</div>';
    if (sharedSubjectsEmpty) sharedSubjectsEmpty.hidden = true;
    return;
  }

  if (list.length === 0) {
    sharedSubjectsGrid.innerHTML = '';
    if (sharedSubjectsEmpty) sharedSubjectsEmpty.hidden = false;
    return;
  }

  if (sharedSubjectsEmpty) sharedSubjectsEmpty.hidden = true;

  sharedSubjectsGrid.innerHTML = '';
  list.forEach((s, idx) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'shared-subject-card';
    card.dataset.sharedIndex = String(idx);

    const bannerUrl = normalizeBannerUrl(s?.bannerUrl);
    const name = String(s?.name ?? '').trim() || 'Materia';
    const icon = String(s?.icon ?? '').trim() || '📚';
    const size = estimateSharedSubjectSize(s) ?? { categories: 0, topics: 0 };

    const banner = document.createElement('div');
    banner.className = 'shared-subject-banner';
    if (bannerUrl) {
      const img = document.createElement('img');
      img.alt = `Banner de ${name}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = bannerUrl;
      banner.appendChild(img);
    }
    card.appendChild(banner);

    const meta = document.createElement('div');
    meta.className = 'shared-subject-meta';
    meta.innerHTML = `
            <div class="shared-subject-name">${escapeHtml(icon) ?? icon} ${escapeHtml(name) ?? name}</div>
            <div class="shared-subject-chip">${size.categories} temas · ${size.topics} items</div>
        `;
    card.appendChild(meta);

    card.addEventListener('click', () => {
      importSharedSubjectIntoApp(s);
    });

    sharedSubjectsGrid.appendChild(card);
  });
}

function flattenTopicsFromPayload(topics, depth = 1) {
  const result = [];
  const list = Array.isArray(topics) ? topics : [];
  for (const item of list) {
    if (typeof item === 'string') {
      const name = item.trim();
      if (name) result.push({ name, level: depth });
      continue;
    }

    if (!item || typeof item !== 'object') continue;
    const name = String(item.name ?? '').trim();
    if (name) {
      const level = Number.isFinite(Number(item.level)) ? Math.max(1, Math.min(20, Number(item.level))) : depth;
      result.push({ name, level });
    }

    if (Array.isArray(item.children) && item.children.length) {
      result.push(...flattenTopicsFromPayload(item.children, depth + 1));
    }
  }

  return result;
}

function newSubjectId() {
  const used = new Set((getAppState()?.subjects ?? []).map((s) => Number(s.id)));
  let id = Date.now();
  while (used.has(id)) id += 1;
  return id;
}

function buildSubjectFromSharedPayload(payload) {
  const name = String(payload?.name ?? '').trim() || 'Materia';
  const icon = String(payload?.icon ?? '').trim() || '📚';
  const color = String(payload?.color ?? '').trim() || '#667eea';

  const id = newSubjectId();
  const subject = createSubject(id, name, icon, color);
  if (!subject) throw new Error('No se pudo crear la materia');
  subject.bannerUrl = normalizeBannerUrl(payload?.bannerUrl) ?? null;

  const categories = Array.isArray(payload?.categories) ? payload.categories : [];
  subject.categories = categories
    .filter((c) => c && typeof c === 'object')
    .map((c) => {
      const catId = addSubjectDraftId();
      const catName = String(c.name ?? '').trim() || 'Tema';
      const catIcon = String(c.icon ?? '').trim() || '📍';
      const flatTopics = flattenTopicsFromPayload(c.topics, 1);
      return {
        id: catId,
        name: catName,
        icon: catIcon,
        topics: flatTopics.map((t) => ({
          name: String(t.name ?? '').trim(),
          level: Math.max(1, Math.min(20, Number(t.level) || 1)),
          completed: false,
          completedAt: null,
          reviews: []
        }))
      };
    });

  const customAchievements = Array.isArray(payload?.customAchievements) ? payload.customAchievements : [];
  subject.meta.customAchievements = customAchievements
    .filter((a) => a && typeof a === 'object')
    .map((a) => ({
      id: String(a.id ?? `custom_${id}_${Date.now()}`),
      title: String(a.title ?? '').trim(),
      desc: String(a.desc ?? '').trim(),
      type: String(a.type ?? 'pct'),
      value: (a.value == null) ? null : Number(a.value),
      categoryId: (a.categoryId == null) ? null : Number(a.categoryId)
    }))
    .filter((a) => a.title);

  ensureSubjectNotes(subject);
  if (payload?.notes && typeof payload.notes === 'object') {
    if (Array.isArray(payload.notes.items)) {
      subject.notes.items = payload.notes.items
        .filter((n) => n && typeof n === 'object')
        .map((n, idx) => ({
          id: String(n.id ?? `n_${Date.now()}_${idx}`),
          title: String(n.title ?? 'Nota').trim() || 'Nota',
          content: String(n.content ?? n.text ?? ''),
          createdAt: Number.isFinite(Number(n.createdAt)) ? Number(n.createdAt) : Date.now(),
          updatedAt: Number.isFinite(Number(n.updatedAt)) ? Number(n.updatedAt) : Date.now()
        }));
      subject.notes.activeId = typeof payload.notes.activeId === 'string' ? payload.notes.activeId : (subject.notes.items[0]?.id ?? null);
    } else if (typeof payload.notes.text === 'string') {
      subject.notes.text = payload.notes.text;
    }
    if (Array.isArray(payload.notes.links)) {
      subject.notes.links = payload.notes.links
        .filter((l) => l && typeof l === 'object' && typeof l.url === 'string')
        .map((l) => ({
          title: typeof l.title === 'string' ? l.title : '',
          url: String(l.url)
        }));
    }
  }
  ensureSubjectNotes(subject);

  return subject;
}

export async function importSharedSubjectIntoApp(payload) {
  const name = String(payload?.name ?? '').trim() || 'Materia';

  const ok = await showConfirmModalV2({
    title: 'Agregar materia',
    text: `¿Querés agregar "${name}" a tus materias?`,
    confirmText: 'Agregar',
    cancelText: 'Cancelar',
    fallbackText: `¿Agregar "${name}"?`
  });
  if (!ok) return;

  try {
    const subject = buildSubjectFromSharedPayload(payload);
    getAppState()?.subjects?.push?.(subject);
    saveData(true);
    await renderAllAndSelectSubject(subject.id);
    showNotification('Materia agregada.');
  } catch (e) {
    console.error(e);
    showNotification('No se pudo agregar la materia.');
  }
}
