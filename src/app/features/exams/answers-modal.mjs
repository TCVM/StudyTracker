import { getCurrentSubject } from '../../core/state.mjs';
import { saveData } from '../../core/storage.mjs';
import { showConfirmModalV2 } from '../../ui/confirm-modal.mjs';
import { showNotification } from '../../../utils/helpers.js';
import { deleteImage, getImage, putImage } from '../../core/idb.mjs';
import { ensureSubjectExams, renderExams } from './exams.mjs';
import { openImageViewer } from '../../ui/image-viewer.mjs';

function byId(id) {
  return document.getElementById(id);
}

let isSetup = false;
let activeRef = null; // { catIndex, itemIndex, questionId, answerId }
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

function showModal() {
  byId('examAnswerModal')?.classList.add('active');
}

function hideModal() {
  byId('examAnswerModal')?.classList.remove('active');
}

function getActiveQuestion() {
  const subject = getCurrentSubject();
  if (!subject || !activeRef) return null;
  ensureSubjectExams(subject);

  const catIndex = Number(activeRef.catIndex);
  const itemIndex = Number(activeRef.itemIndex);
  if (!Number.isFinite(catIndex) || !Number.isFinite(itemIndex)) return null;

  const cat = subject.exams?.[catIndex];
  const item = (cat?.items || [])[itemIndex];
  if (!cat || !item) return null;

  if (!Array.isArray(item.questions)) item.questions = [];
  const q = item.questions.find((x) => String(x?.id ?? '') === String(activeRef.questionId ?? '')) ?? null;
  if (!q) return null;
  if (!Array.isArray(q.answers)) q.answers = [];

  return { subject, cat, item, question: q, catIndex, itemIndex };
}

async function renderImages(ids) {
  const grid = byId('examAnswerImagesGrid');
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
    del.className = 'exam-answer-image-del-btn';
    del.title = 'Eliminar';
    del.textContent = '×';
    del.dataset.imageId = id;
    actions.appendChild(del);

    wrap.appendChild(actions);
    grid.appendChild(wrap);
  }
}

export async function openExamAnswerModal(catIndex, itemIndex, questionId, answerId = null) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectExams(subject);

  activeRef = {
    catIndex: Number(catIndex),
    itemIndex: Number(itemIndex),
    questionId: String(questionId ?? ''),
    answerId: answerId ? String(answerId) : null
  };
  draftImageIds = [];

  const ctx = getActiveQuestion();
  if (!ctx) return;

  const modal = byId('examAnswerModal');
  if (modal) {
    modal.dataset.categoryIndex = String(ctx.catIndex);
    modal.dataset.itemIndex = String(ctx.itemIndex);
    modal.dataset.questionId = String(activeRef.questionId);
    modal.dataset.answerId = activeRef.answerId ? String(activeRef.answerId) : '';
  }

  const titleEl = byId('examAnswerModalTitle');
  const metaEl = byId('examAnswerMeta');
  const textEl = byId('examAnswerText');

  const existing = activeRef.answerId
    ? (ctx.question.answers ?? []).find((a) => String(a?.id ?? '') === String(activeRef.answerId))
    : null;

  const text = existing ? String(existing.text ?? '') : '';
  const images = existing ? (Array.isArray(existing.images) ? existing.images.map(String).filter(Boolean) : []) : [];

  if (titleEl) titleEl.textContent = existing ? 'Editar respuesta' : 'Nueva respuesta';
  if (metaEl) metaEl.textContent = `${ctx.cat?.name ?? 'Categoría'} — ${ctx.item?.title ?? 'Examen'} — ${ctx.question?.q ?? 'Pregunta'}`;
  if (textEl) textEl.value = text;

  await renderImages(images);
  showModal();
}

async function addImagesFromInput(fileList) {
  const files = Array.from(fileList ?? []).filter(Boolean);
  if (!files.length) return;

  const ctx = getActiveQuestion();
  if (!ctx) return;

  const modal = byId('examAnswerModal');
  const answerId = String(modal?.dataset?.answerId ?? '').trim();
  const existing = answerId ? (ctx.question.answers ?? []).find((a) => String(a?.id ?? '') === answerId) : null;
  const currentIds = existing
    ? (Array.isArray(existing.images) ? existing.images.map(String).filter(Boolean) : [])
    : (draftImageIds.map(String).filter(Boolean));

  const maxPerImageBytes = 2 * 1024 * 1024;
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

    const id = `eimg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
    renderExams();
  } else {
    draftImageIds = nextIds;
  }

  await renderImages(nextIds);
}

async function deleteImageFromModal(imageId) {
  const id = String(imageId ?? '').trim();
  if (!id) return;

  const ctx = getActiveQuestion();
  if (!ctx) return;

  const modal = byId('examAnswerModal');
  const answerId = String(modal?.dataset?.answerId ?? '').trim();
  const existing = answerId ? (ctx.question.answers ?? []).find((a) => String(a?.id ?? '') === answerId) : null;

  if (existing) {
    existing.images = (Array.isArray(existing.images) ? existing.images : []).map(String).filter(Boolean).filter((x) => x !== id);
    saveData(true);
    renderExams();
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
  const ctx = getActiveQuestion();
  if (!ctx) return;

  const modal = byId('examAnswerModal');
  const answerId = String(modal?.dataset?.answerId ?? '').trim();

  const textEl = byId('examAnswerText');
  const text = String(textEl?.value ?? '').trim();

  if (!text && !draftImageIds.length) {
    showNotification('Escribe algo o agrega una imagen.');
    return;
  }

  if (answerId) {
    const existing = (ctx.question.answers ?? []).find((a) => String(a?.id ?? '') === answerId);
    if (existing) existing.text = text;
  } else {
    ctx.question.answers.unshift({
      id: `ans_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      text,
      images: draftImageIds.slice()
    });
  }

  draftImageIds = [];
  saveData(true);
  renderExams();

  revokeObjectUrls();
  hideModal();
  activeRef = null;
}

export async function deleteExamAnswer(catIndex, itemIndex, questionId, answerId) {
  const subject = getCurrentSubject();
  if (!subject) return;
  ensureSubjectExams(subject);

  const ctx = (() => {
    const cat = subject.exams?.[Number(catIndex)];
    const item = (cat?.items || [])[Number(itemIndex)];
    const q = (item?.questions || []).find((x) => String(x?.id ?? '') === String(questionId ?? '')) ?? null;
    return { cat, item, q };
  })();

  if (!ctx.q) return;
  const id = String(answerId ?? '').trim();
  if (!id) return;

  const entry = (ctx.q.answers ?? []).find((a) => String(a?.id ?? '') === id) ?? null;
  const ok = await showConfirmModalV2({
    title: 'Eliminar respuesta',
    text: '¿Eliminar esta respuesta?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    fallbackText: '¿Eliminar respuesta?'
  });
  if (!ok) return;

  ctx.q.answers = (Array.isArray(ctx.q.answers) ? ctx.q.answers : []).filter((a) => String(a?.id ?? '') !== id);
  saveData(true);
  renderExams();

  const imgs = Array.isArray(entry?.images) ? entry.images : [];
  for (const imgId of imgs) {
    try {
      await deleteImage(imgId);
    } catch {
      // ignore
    }
  }
}

export function setupExamAnswerModal() {
  if (isSetup) return;
  isSetup = true;

  const modal = byId('examAnswerModal');
  const closeX = byId('closeExamAnswerModal');
  const cancelBtn = byId('examAnswerCancelBtn');
  const saveBtn = byId('examAnswerSaveBtn');
  const addImgBtn = byId('examAnswerAddImageBtn');
  const input = byId('examAnswerImageInput');
  const grid = byId('examAnswerImagesGrid');

  const closeNoConfirm = async () => {
    const text = String(byId('examAnswerText')?.value ?? '').trim();
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
    const btn = e.target?.closest?.('.exam-answer-image-del-btn');
    if (btn) {
      const id = btn.dataset?.imageId;
      void deleteImageFromModal(id);
      return;
    }

    const img = e.target?.closest?.('.topic-note-image img');
    if (!img) return;
    if (e.target?.closest?.('.topic-note-image-actions')) return;
    const src = img.getAttribute('src');
    if (!src) return;
    openImageViewer(src, { title: 'Imagen', alt: 'Imagen' });
  });
}
