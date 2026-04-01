import { showConfirmModalV2 } from '../ui/confirm-modal.mjs';
import { getAppState, getCurrentSubject } from '../core/state.mjs';
import { getSharedSubjects, getSharedSubjectsLoaded, getSharedSubjectsLoadError } from './state.mjs';
import { estimateSharedSubjectSize, normalizeBannerUrl } from './core.mjs';
import { escapeHtml, showNotification, formatDurationMs } from '../../utils/helpers.js';
import { ensureSubjectNotes } from '../features/notes/notes-skilltree-stats.mjs';
import { addSubjectDraftId } from '../features/subject/drafts.mjs';
import { createSubject, saveData } from '../core/storage.mjs';
import { putImage } from '../core/idb.mjs';

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

export function renderExamCountdown() {
  const countdownEl = byId('examCountdown');
  const listEl = byId('upcomingExamsList');
  const pillEl = byId('subjectNextExamPill');
  if (!countdownEl && !listEl && !pillEl) return;

  const subject = getCurrentSubject();
  if (!subject) {
    if (countdownEl) countdownEl.innerHTML = '';
    if (listEl) listEl.innerHTML = '';
    if (pillEl) pillEl.hidden = true;
    return;
  }

  const upcomingRaw = Array.isArray(subject.upcomingExams) ? subject.upcomingExams : [];
  const upcoming = upcomingRaw
    .filter((x) => x && typeof x === 'object')
    .map((x) => ({ id: String(x.id ?? ''), title: String(x.title ?? '').trim(), at: Number(x.at) }))
    .filter((x) => x.id && Number.isFinite(x.at))
    .sort((a, b) => a.at - b.at);

  const now = Date.now();
  const next = upcoming.find((x) => x.at > now) ?? null;

  const formatDateTimeShort = (ts) => {
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const getUrgency = (remainingMs) => {
    if (remainingMs <= 0) return 'overdue';
    if (remainingMs < 24 * 60 * 60 * 1000) return 'soon';
    return 'ok';
  };

  const countdownText = (ts, prefix = 'Examen') => {
    const remaining = ts - now;
    if (remaining <= 0) return `${prefix} vencido`;
    return `${prefix} en ${formatDurationMs(remaining)}`;
  };

  if (countdownEl) {
    if (!next) {
      countdownEl.innerHTML = '';
      countdownEl.dataset.urgency = '';
    } else {
      const remaining = next.at - now;
      const urgency = getUrgency(remaining);
      const title = next.title ? `${next.title} - ` : '';
      const text = `Proximo - ${title}${countdownText(next.at)}`;
      const when = `(${formatDateTimeShort(next.at)})`;

      countdownEl.dataset.urgency = urgency;
      countdownEl.innerHTML = '';

      const main = document.createElement('span');
      main.style.fontWeight = '800';
      main.textContent = text;

      const sub = document.createElement('span');
      sub.style.fontSize = '0.92em';
      sub.style.opacity = '0.9';
      sub.textContent = ` ${when}`;

      countdownEl.appendChild(main);
      countdownEl.appendChild(sub);
    }
  }

  if (pillEl) {
    if (!next) {
      pillEl.hidden = true;
      pillEl.textContent = '';
      pillEl.dataset.urgency = '';
    } else {
      pillEl.hidden = false;
      const title = next.title ? `${next.title} - ` : '';
      pillEl.textContent = `Proximo - ${title}${countdownText(next.at)} (${formatDateTimeShort(next.at)})`;
      pillEl.dataset.urgency = getUrgency(next.at - now);
    }
  }

  if (listEl) {
    listEl.innerHTML = '';

    if (!upcoming.length) {
      listEl.innerHTML = '<div class="upcoming-exam-item"><div class="upcoming-exam-left"><div class="upcoming-exam-title">Sin proximos examenes</div><div class="upcoming-exam-meta">Agrega uno con "Proximo".</div></div></div>';
      return;
    }

    const makeRow = (x, options = null) => {
      const row = document.createElement('div');
      row.className = 'upcoming-exam-item';
      row.dataset.urgency = getUrgency(x.at - now);
      if (options?.isNext) row.classList.add('is-next');

      const left = document.createElement('div');
      left.className = 'upcoming-exam-left';

      const titleEl = document.createElement('div');
      titleEl.className = 'upcoming-exam-title';
      titleEl.textContent = options?.isNext ? (x.title ? `Proximo - ${x.title}` : 'Proximo - Examen') : (x.title || 'Examen');

      const metaEl = document.createElement('div');
      metaEl.className = 'upcoming-exam-meta';
      const remaining = x.at - now;
      const rel = remaining <= 0 ? `Vencido hace ${formatDurationMs(Math.abs(remaining))}` : `En ${formatDurationMs(remaining)}`;
      metaEl.textContent = `${rel} (${formatDateTimeShort(x.at)})`;

      left.appendChild(titleEl);
      left.appendChild(metaEl);

      const actions = document.createElement('div');
      actions.className = 'upcoming-exam-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-secondary btn-small';
      editBtn.textContent = 'Editar';
      editBtn.dataset.action = 'upcoming_edit';
      editBtn.dataset.examId = x.id;

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-danger btn-small';
      delBtn.textContent = 'Eliminar';
      delBtn.dataset.action = 'upcoming_delete';
      delBtn.dataset.examId = x.id;

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      row.appendChild(left);
      row.appendChild(actions);
      return row;
    };

    if (next) listEl.appendChild(makeRow(next, { isNext: true }));

    const rest = upcoming.filter((x) => !next || x.id !== next.id);
    if (!rest.length) return;

    if (rest.length > 4) {
      const scroll = document.createElement('div');
      scroll.className = 'upcoming-exams-scroll';
      rest.forEach((x) => scroll.appendChild(makeRow(x)));
      listEl.appendChild(scroll);
    } else {
      rest.forEach((x) => listEl.appendChild(makeRow(x)));
    }
  }
}

export function showExamDateModal(examId = null) {
  const modal = byId('examDateModal');
  if (!modal) return;
  const subject = getCurrentSubject();
  if (!subject) return;

  const titleEl = byId('examDateModalTitle');
  const titleInput = byId('examTitleInput');
  const dateTimeInput = byId('examDateTimeInput');

  const toLocalInputValue = (ts) => {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const upcoming = Array.isArray(subject.upcomingExams) ? subject.upcomingExams : [];
  const selected = examId ? upcoming.find((x) => String(x?.id) === String(examId)) : null;

  modal.dataset.examId = selected ? String(selected.id) : '';
  if (titleEl) titleEl.textContent = selected ? 'Editar proximo examen' : 'Agregar proximo examen';
  if (titleInput) titleInput.value = selected ? String(selected.title ?? '') : '';
  if (dateTimeInput) dateTimeInput.value = selected?.at ? toLocalInputValue(Number(selected.at)) : '';

  updateExamDatePreview();
  modal.classList.add('active');
}

export function hideExamDateModal() {
  const modal = byId('examDateModal');
  modal?.classList.remove('active');
  if (modal) modal.dataset.examId = '';
}

export function updateExamDatePreview() {
  const preview = byId('examDatePreview');
  const titleInput = byId('examTitleInput');
  const dateTimeInput = byId('examDateTimeInput');
  if (!preview) return;

  const raw = String(dateTimeInput?.value ?? '').trim();
  if (!raw) {
    preview.innerHTML = '';
    return;
  }

  const parseLocal = (value) => {
    const parts = value.split('T');
    if (parts.length !== 2) return null;
    const [y, m, d] = parts[0].split('-').map((n) => Number(n));
    const [hh, mm] = parts[1].split(':').map((n) => Number(n));
    if (![y, m, d, hh, mm].every((n) => Number.isFinite(n))) return null;
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  };

  const dateObj = parseLocal(raw);
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    preview.innerHTML = '';
    return;
  }

  const formatted = dateObj.toLocaleString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const title = String(titleInput?.value ?? '').trim();
  preview.innerHTML = '<strong>Resumen:</strong> ';
  preview.append(document.createTextNode(`${title ? `${title} - ` : ''}${formatted}`));
}

export function renderSharedSubjects() {
  const sharedSubjectsGrid = byId('sharedSubjectsGrid');
  const sharedSubjectsEmpty = byId('sharedSubjectsEmpty');
  if (!sharedSubjectsGrid) return;

  if (!getSharedSubjectsLoaded()) {
    sharedSubjectsGrid.innerHTML = '<div class="shared-empty">Cargando materias compartidas...</div>';
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
    const metaInfo = s?.__sharedMeta && typeof s.__sharedMeta === 'object' ? s.__sharedMeta : null;
    const author = String(metaInfo?.ownerLogin ?? '').trim();

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
            ${author ? `<div class="shared-subject-chip">por @${escapeHtml(author)}</div>` : ''}
        `;
    card.appendChild(meta);

    card.addEventListener('click', () => {
      void importSharedSubjectIntoApp(s);
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

async function dataUrlToBlob(dataUrl, fallbackType = '') {
  const raw = String(dataUrl ?? '').trim();
  if (!raw.startsWith('data:')) return null;
  const res = await fetch(raw);
  const blob = await res.blob();
  if (!fallbackType || blob.type) return blob;
  return new Blob([await blob.arrayBuffer()], { type: fallbackType });
}

async function buildSubjectFromSharedPayload(payload) {
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

  for (let catIndex = 0; catIndex < subject.categories.length; catIndex += 1) {
    const sourceCategory = categories[catIndex];
    const sourceTopics = Array.isArray(sourceCategory?.topics) ? sourceCategory.topics : [];
    const targetTopics = Array.isArray(subject.categories[catIndex]?.topics) ? subject.categories[catIndex].topics : [];

    for (let topicIndex = 0; topicIndex < Math.min(sourceTopics.length, targetTopics.length); topicIndex += 1) {
      const sourceTopic = sourceTopics[topicIndex];
      const targetTopic = targetTopics[topicIndex];
      if (!sourceTopic?.note || typeof sourceTopic.note !== 'object') continue;

      const text = String(sourceTopic.note.text ?? '');
      const images = Array.isArray(sourceTopic.note.images) ? sourceTopic.note.images : [];
      const nextImageIds = [];

      for (let imgIndex = 0; imgIndex < images.length; imgIndex += 1) {
        const image = images[imgIndex];
        const blob = await dataUrlToBlob(image?.dataUrl, String(image?.type ?? ''));
        if (!blob) continue;
        const imgId = `simg_${Date.now()}_${catIndex}_${topicIndex}_${imgIndex}`;
        try {
          await putImage(imgId, blob, { type: blob.type, createdAt: Date.now() });
          nextImageIds.push(imgId);
        } catch {
          // ignore individual image failures
        }
      }

      if (text || nextImageIds.length) {
        targetTopic.note = { text, images: nextImageIds };
      }
    }
  }

  return subject;
}

export async function importSharedSubjectIntoApp(payload) {
  const name = String(payload?.name ?? '').trim() || 'Materia';

  const ok = await showConfirmModalV2({
    title: 'Agregar materia',
    text: `Quieres agregar "${name}" a tus materias?`,
    confirmText: 'Agregar',
    cancelText: 'Cancelar',
    fallbackText: `Agregar "${name}"?`
  });
  if (!ok) return;

  try {
    const subject = await buildSubjectFromSharedPayload(payload);
    getAppState()?.subjects?.push?.(subject);
    saveData(true);
    await renderAllAndSelectSubject(subject.id);
    showNotification('Materia agregada.');
  } catch (e) {
    console.error(e);
    showNotification('No se pudo agregar la materia.');
  }
}
