import { getCurrentSubject } from '../../core/state.mjs';
import { saveData } from '../../core/storage.mjs';
import { showConfirmModalV2 } from '../../ui/confirm-modal.mjs';
import { showNotification } from '../../../utils/helpers.js';
import { deleteImage, getImage, putImage } from '../../core/idb.mjs';
import { ensureSubjectPractices, renderPractices } from './practices.mjs';
import { openImageViewer } from '../../ui/image-viewer.mjs';

function byId(id) {
  return document.getElementById(id);
}

let isSetup = false;
let activeRef = null; // { practiceIndex, exerciseIndex, answerId }
let draftImageIds = [];
let objectUrls = [];

function revokeObjectUrls() {
  for (const url of objectUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  objectUrls = [];
}

function hideModal() {
  const modal = byId('practiceAnswerModal');
  modal?.classList.remove('active');
}

function showModal() {
  const modal = byId('practiceAnswerModal');
  modal?.classList.add('active');
}

function getActiveExercise() {
  const subject = getCurrentSubject();
  if (!subject || !activeRef) return null;
  ensureSubjectPractices(subject);

  const pIdx = Number(activeRef.practiceIndex);
  const eIdx = Number(activeRef.exerciseIndex);
  if (!Number.isFinite(pIdx) || !Number.isFinite(eIdx)) return null;

  const practice = subject.practices?.[pIdx];
  const exercise = practice?.exercises?.[eIdx];
  if (!practice || !exercise) return null;

  if (!Array.isArray(exercise.answers)) exercise.answers = [];
  return { subject, practice, exercise, practiceIndex: pIdx, exerciseIndex: eIdx };
}

async function renderImages(ids) {
  const grid = byId('practiceAnswerImagesGrid');
  if (!grid) return;

  revokeObjectUrls();
  grid.innerHTML = '';

  const list = Array.isArray(ids) ? ids.map(String).filter(Boolean) : [];
  if (!list.length) {
    grid.innerHTML = `<div class="links-empty" style="grid-column: 1/-1;">No hay imágenes todavía.</div>`;
    return;
  }

  for (const id of list) {
    const blob = await getImage(id);
    if (!blob) continue;

    const url = URL.createObjectURL(blob);
    objectUrls.push(url);

    const wrap = document.createElement('div');
    wrap.className = 'topic-note-image';
    wrap.dataset.imageId = id;

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Imagen';
    wrap.appendChild(img);

    const actions = document.createElement('div');
    actions.className = 'topic-note-image-actions';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'practice-answer-image-del-btn';
    del.title = 'Eliminar';
    del.textContent = '×';
    del.dataset.imageId = id;
    actions.appendChild(del);

    wrap.appendChild(actions);
    grid.appendChild(wrap);
  }
}

export async function openPracticeAnswerModal(practiceIndex, exerciseIndex, answerId = null) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectPractices(subject);

  activeRef = { practiceIndex: Number(practiceIndex), exerciseIndex: Number(exerciseIndex), answerId: answerId ? String(answerId) : null };
  draftImageIds = [];

  const ctx = getActiveExercise();
  if (!ctx) return;

  const modal = byId('practiceAnswerModal');
  if (modal) {
    modal.dataset.practiceIndex = String(ctx.practiceIndex);
    modal.dataset.exerciseIndex = String(ctx.exerciseIndex);
    modal.dataset.answerId = activeRef.answerId ? String(activeRef.answerId) : '';
  }

  const titleEl = byId('practiceAnswerModalTitle');
  const metaEl = byId('practiceAnswerMeta');
  const textEl = byId('practiceAnswerText');

  let text = '';
  let images = [];

  const existing = activeRef.answerId
    ? (ctx.exercise.answers ?? []).find((a) => String(a?.id ?? '') === String(activeRef.answerId))
    : null;

  if (existing) {
    text = String(existing.text ?? '');
    images = Array.isArray(existing.images) ? existing.images.map(String).filter(Boolean) : [];
    if (titleEl) titleEl.textContent = 'Editar respuesta';
  } else {
    if (titleEl) titleEl.textContent = 'Nueva respuesta';
  }

  if (metaEl) metaEl.textContent = `${ctx.practice?.name ?? 'Práctica'} — ${ctx.exercise?.title ?? 'Ejercicio'}`;
  if (textEl) textEl.value = text;

  await renderImages(images);
  showModal();
}

async function addImagesFromInput(fileList) {
  const files = Array.from(fileList ?? []).filter(Boolean);
  if (!files.length) return;

  const ctx = getActiveExercise();
  if (!ctx) return;

  const modal = byId('practiceAnswerModal');
  const answerId = String(modal?.dataset?.answerId ?? '').trim();
  const existing = answerId ? (ctx.exercise.answers ?? []).find((a) => String(a?.id ?? '') === answerId) : null;
  const currentIds = existing
    ? (Array.isArray(existing.images) ? existing.images.map(String).filter(Boolean) : [])
    : (draftImageIds.map(String).filter(Boolean));

  const maxPerImageBytes = 2 * 1024 * 1024; // 2MB
  const maxImages = 24;
  let nextIds = currentIds.slice();

  for (const file of files) {
    if (nextIds.length >= maxImages) {
      showNotification('Demasiadas imágenes (máx 24).');
      break;
    }
    if (file.size > maxPerImageBytes) {
      showNotification('Imagen muy grande. Probá comprimirla (máx 2MB).');
      continue;
    }

    const id = `pimg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    try {
      await putImage(id, file, { type: file.type, createdAt: Date.now() });
      nextIds.push(id);
      if (!existing) draftImageIds.push(id);
    } catch (e) {
      console.error(e);
      showNotification('No se pudo guardar la imagen.');
    }
  }

  if (existing) {
    existing.images = nextIds;
    saveData(true);
    renderPractices();
  } else {
    draftImageIds = nextIds;
  }

  await renderImages(nextIds);
}

async function deleteImageFromModal(imageId) {
  const id = String(imageId ?? '').trim();
  if (!id) return;

  const ctx = getActiveExercise();
  if (!ctx) return;

  const modal = byId('practiceAnswerModal');
  const answerId = String(modal?.dataset?.answerId ?? '').trim();
  const existing = answerId ? (ctx.exercise.answers ?? []).find((a) => String(a?.id ?? '') === answerId) : null;

  if (existing) {
    existing.images = (Array.isArray(existing.images) ? existing.images : []).map(String).filter(Boolean).filter((x) => x !== id);
    saveData(true);
    renderPractices();
  } else {
    draftImageIds = draftImageIds.map(String).filter(Boolean).filter((x) => x !== id);
  }

  try {
    await deleteImage(id);
  } catch {
    // ignore
  }

  const ids = existing ? (existing.images ?? []) : draftImageIds;
  await renderImages(ids);
}

async function cancelModal() {
  const ok = await showConfirmModalV2({
    title: 'Cancelar',
    text: '¿Descartar cambios?',
    confirmText: 'Descartar',
    cancelText: 'Seguir editando',
    fallbackText: '¿Descartar cambios?'
  });
  if (!ok) return;

  // Cleanup draft images (not yet attached to an answer)
  for (const id of draftImageIds) {
    try {
      await deleteImage(id);
    } catch {
      // ignore
    }
  }
  draftImageIds = [];
  revokeObjectUrls();
  hideModal();
  activeRef = null;
}

async function saveModal() {
  const ctx = getActiveExercise();
  if (!ctx) return;

  const modal = byId('practiceAnswerModal');
  const answerId = String(modal?.dataset?.answerId ?? '').trim();

  const textEl = byId('practiceAnswerText');
  const text = String(textEl?.value ?? '').trim();

  if (!text && !draftImageIds.length) {
    showNotification('Escribe algo o agrega una imagen.');
    return;
  }

  if (answerId) {
    const existing = (ctx.exercise.answers ?? []).find((a) => String(a?.id ?? '') === answerId);
    if (existing) existing.text = text;
  } else {
    ctx.exercise.answers.unshift({
      id: `ans_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      text,
      images: draftImageIds.slice()
    });
  }

  draftImageIds = [];
  saveData(true);
  renderPractices();

  revokeObjectUrls();
  hideModal();
  activeRef = null;
}

export async function deletePracticeAnswer(practiceIndex, exerciseIndex, answerId) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectPractices(subject);

  const pIdx = Number(practiceIndex);
  const eIdx = Number(exerciseIndex);
  if (!Number.isFinite(pIdx) || !Number.isFinite(eIdx)) return;

  const ex = subject.practices?.[pIdx]?.exercises?.[eIdx];
  if (!ex) return;

  const id = String(answerId ?? '').trim();
  if (!id) return;

  const entry = (ex.answers ?? []).find((a) => String(a?.id ?? '') === id);
  const ok = await showConfirmModalV2({
    title: 'Eliminar respuesta',
    text: '¿Eliminar esta respuesta?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    fallbackText: '¿Eliminar respuesta?'
  });
  if (!ok) return;

  ex.answers = (Array.isArray(ex.answers) ? ex.answers : []).filter((a) => String(a?.id ?? '') !== id);
  saveData(true);
  renderPractices();

  const imgs = Array.isArray(entry?.images) ? entry.images : [];
  for (const imgId of imgs) {
    try {
      await deleteImage(imgId);
    } catch {
      // ignore
    }
  }
}

export function setupPracticeAnswerModal() {
  if (isSetup) return;
  isSetup = true;

  const modal = byId('practiceAnswerModal');
  const closeX = byId('closePracticeAnswerModal');
  const cancelBtn = byId('practiceAnswerCancelBtn');
  const saveBtn = byId('practiceAnswerSaveBtn');
  const addImgBtn = byId('practiceAnswerAddImageBtn');
  const input = byId('practiceAnswerImageInput');
  const grid = byId('practiceAnswerImagesGrid');

  const closeNoConfirm = async () => {
    // behave like cancel, but if nothing to discard, close silently
    const text = String(byId('practiceAnswerText')?.value ?? '').trim();
    const hasDraft = draftImageIds.length > 0;
    if (!text && !hasDraft) {
      revokeObjectUrls();
      hideModal();
      activeRef = null;
      return;
    }
    await cancelModal();
  };

  closeX?.addEventListener('click', () => void closeNoConfirm());
  cancelBtn?.addEventListener('click', () => void cancelModal());
  saveBtn?.addEventListener('click', () => void saveModal());

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) void closeNoConfirm();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const viewer = document.getElementById('imageViewerModal');
    if (viewer?.classList?.contains?.('active')) return;
    if (modal?.classList.contains('active')) void closeNoConfirm();
  });

  addImgBtn?.addEventListener('click', () => input?.click?.());
  input?.addEventListener('change', async () => {
    const files = input.files;
    if (!files || !files.length) return;
    await addImagesFromInput(files);
    input.value = '';
  });

  grid?.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('.practice-answer-image-del-btn');
    if (!btn) return;
    const id = btn.dataset?.imageId;
    void deleteImageFromModal(id);
  });

  grid?.addEventListener('click', (e) => {
    const img = e.target?.closest?.('.topic-note-image img');
    if (!img) return;
    if (e.target?.closest?.('.topic-note-image-actions')) return;
    const src = img.getAttribute('src');
    if (!src) return;
    openImageViewer(src, { title: 'Imagen', alt: 'Imagen' });
  });
}
