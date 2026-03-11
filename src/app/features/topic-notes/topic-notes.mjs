import { getCurrentSubject } from '../../core/state.mjs';
import { saveData } from '../../core/storage.mjs';
import { showNotification } from '../../../utils/helpers.js';
import { showConfirmModalV2 } from '../../ui/confirm-modal.mjs';
import { deleteTopicNoteImage, getTopicNoteImage, putTopicNoteImage } from '../../core/idb.mjs';
import { openImageViewer } from '../../ui/image-viewer.mjs';

function byId(id) {
  return document.getElementById(id);
}

let isSetup = false;
let activeRef = null; // { categoryId, topicIndex }
let saveTimeoutId = null;
let objectUrls = [];

function getActiveTopic() {
  const subject = getCurrentSubject();
  if (!subject || !activeRef) return null;
  const categoryId = Number(activeRef.categoryId);
  const topicIndex = Number(activeRef.topicIndex);
  if (!Number.isFinite(categoryId) || !Number.isFinite(topicIndex)) return null;

  const category = (subject.categories ?? []).find((c) => Number(c?.id) === categoryId) ?? null;
  const topic = category?.topics?.[topicIndex] ?? null;
  if (!topic) return null;

  return { subject, category, topic, categoryId, topicIndex };
}

function ensureTopicNote(topic) {
  if (!topic || typeof topic !== 'object') return null;
  if (!topic.note || typeof topic.note !== 'object') topic.note = { text: '', images: [] };
  if (typeof topic.note.text !== 'string') topic.note.text = '';
  if (!Array.isArray(topic.note.images)) topic.note.images = [];
  topic.note.images = topic.note.images.map(String).filter(Boolean);
  return topic.note;
}

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

async function renderImagesGrid() {
  const grid = byId('topicNoteImagesGrid');
  if (!grid) return;

  const ctx = getActiveTopic();
  if (!ctx) {
    grid.innerHTML = '';
    return;
  }

  const note = ensureTopicNote(ctx.topic);
  const ids = Array.isArray(note?.images) ? note.images : [];

  revokeObjectUrls();
  grid.innerHTML = '';

  if (!ids.length) {
    grid.innerHTML = `<div class="links-empty" style="grid-column: 1/-1;">No hay imágenes todavía.</div>`;
    return;
  }

  for (const id of ids) {
    const blob = await getTopicNoteImage(id);
    if (!blob) continue;

    const url = URL.createObjectURL(blob);
    objectUrls.push(url);

    const wrap = document.createElement('div');
    wrap.className = 'topic-note-image';
    wrap.dataset.imageId = id;

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Imagen de nota';
    wrap.appendChild(img);

    const actions = document.createElement('div');
    actions.className = 'topic-note-image-actions';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'topic-note-image-del-btn';
    del.title = 'Eliminar';
    del.textContent = '×';
    del.dataset.imageId = id;
    actions.appendChild(del);

    wrap.appendChild(actions);
    grid.appendChild(wrap);
  }
}

function showModal() {
  const modal = byId('topicNoteModal');
  if (!modal) return;
  modal.classList.add('active');
}

function hideModal() {
  const modal = byId('topicNoteModal');
  if (!modal) return;
  modal.classList.remove('active');
}

export async function openTopicNoteModal(categoryId, topicIndex) {
  const subject = getCurrentSubject();
  if (!subject) return;

  activeRef = { categoryId: Number(categoryId), topicIndex: Number(topicIndex) };
  const ctx = getActiveTopic();
  if (!ctx) return;

  const note = ensureTopicNote(ctx.topic);

  const titleEl = byId('topicNoteModalTitle');
  const metaEl = byId('topicNoteMeta');
  const textEl = byId('topicNoteText');
  if (titleEl) titleEl.textContent = `Notas — ${String(ctx.topic?.name ?? 'Tema')}`;
  if (metaEl) metaEl.textContent = `${String(ctx.category?.icon ?? '')} ${String(ctx.category?.name ?? '')}`.trim();
  if (textEl) textEl.value = String(note?.text ?? '');

  await renderImagesGrid();
  showModal();

  try {
    textEl?.focus?.();
  } catch {
    // ignore
  }
}

async function addImagesFromInput(fileList) {
  const ctx = getActiveTopic();
  if (!ctx) return;

  const note = ensureTopicNote(ctx.topic);
  const files = Array.from(fileList ?? []).filter(Boolean);
  if (!files.length) return;

  const maxPerImageBytes = 2 * 1024 * 1024; // 2MB (IDB), avoid accidental huge blobs
  const maxImages = 24;

  for (const file of files) {
    if (note.images.length >= maxImages) {
      showNotification('Demasiadas imágenes en una nota (máx 24).');
      break;
    }

    if (file.size > maxPerImageBytes) {
      showNotification('Imagen muy grande. Probá comprimirla (máx 2MB).');
      continue;
    }

    const id = `timg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    try {
      await putTopicNoteImage(id, file, { type: file.type, createdAt: Date.now() });
      note.images.push(id);
    } catch (e) {
      console.error(e);
      showNotification('No se pudo guardar la imagen.');
    }
  }

  saveData(true);
  await renderImagesGrid();
}

async function deleteImage(imageId) {
  const ctx = getActiveTopic();
  if (!ctx) return;

  const note = ensureTopicNote(ctx.topic);
  const id = String(imageId ?? '').trim();
  if (!id) return;

  note.images = (note.images ?? []).filter((x) => String(x) !== id);
  try {
    await deleteTopicNoteImage(id);
  } catch {
    // ignore
  }

  saveData(true);
  await renderImagesGrid();
}

async function clearNote() {
  const ctx = getActiveTopic();
  if (!ctx) return;

  const ok = await showConfirmModalV2({
    title: 'Limpiar nota',
    text: '¿Borrar texto e imágenes de esta nota?',
    confirmText: 'Limpiar',
    cancelText: 'Cancelar',
    fallbackText: '¿Limpiar nota?'
  });
  if (!ok) return;

  const note = ensureTopicNote(ctx.topic);
  const ids = Array.isArray(note.images) ? note.images.slice() : [];

  note.text = '';
  note.images = [];
  saveData(true);

  for (const id of ids) {
    try {
      await deleteTopicNoteImage(id);
    } catch {
      // ignore
    }
  }

  const textEl = byId('topicNoteText');
  if (textEl) textEl.value = '';
  await renderImagesGrid();
}

function scheduleSaveFromTextarea() {
  if (saveTimeoutId) clearTimeout(saveTimeoutId);
  saveTimeoutId = setTimeout(() => {
    saveTimeoutId = null;
    const ctx = getActiveTopic();
    if (!ctx) return;
    const note = ensureTopicNote(ctx.topic);
    const textEl = byId('topicNoteText');
    note.text = String(textEl?.value ?? '');
    saveData(true);
  }, 350);
}

export function setupTopicNoteModal() {
  if (isSetup) return;
  isSetup = true;

  const modal = byId('topicNoteModal');
  const closeX = byId('closeTopicNoteModal');
  const closeBtn = byId('topicNoteCloseBtn');
  const delBtn = byId('topicNoteDeleteBtn');
  const textEl = byId('topicNoteText');
  const addImageBtn = byId('topicNoteAddImageBtn');
  const imageInput = byId('topicNoteImageInput');
  const grid = byId('topicNoteImagesGrid');

  const close = () => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      saveTimeoutId = null;
    }
    revokeObjectUrls();
    hideModal();
    activeRef = null;
  };

  closeX?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const viewer = document.getElementById('imageViewerModal');
    if (viewer?.classList?.contains?.('active')) return;
    if (modal?.classList.contains('active')) close();
  });

  textEl?.addEventListener('input', () => scheduleSaveFromTextarea());
  textEl?.addEventListener('blur', () => scheduleSaveFromTextarea());

  addImageBtn?.addEventListener('click', () => imageInput?.click?.());
  imageInput?.addEventListener('change', async () => {
    const files = imageInput.files;
    if (!files || !files.length) return;
    await addImagesFromInput(files);
    imageInput.value = '';
  });

  grid?.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('.topic-note-image-del-btn');
    if (!btn) return;
    const id = btn.dataset?.imageId;
    void deleteImage(id);
  });

  grid?.addEventListener('click', (e) => {
    const img = e.target?.closest?.('.topic-note-image img');
    if (!img) return;
    if (e.target?.closest?.('.topic-note-image-actions')) return;
    const src = img.getAttribute('src');
    if (!src) return;
    openImageViewer(src, { title: 'Imagen de nota', alt: 'Imagen de nota' });
  });

  delBtn?.addEventListener('click', () => void clearNote());
}
