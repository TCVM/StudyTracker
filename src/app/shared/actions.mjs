import { showConfirmModalV2 } from '../ui/confirm-modal.mjs';
import { getCurrentSubject } from '../core/state.mjs';
import { getSharedSubjectsLocal, setSharedSubjectsLoaded, setSharedSubjectsLoadError, setSharedSubjectsLocal } from './state.mjs';
import { showNotification } from '../../utils/helpers.js';
import { ensureSubjectNotes } from '../features/notes/notes-skilltree-stats.mjs';
import { setActiveView } from '../ui/flow.mjs';
import { renderSharedSubjects } from './ui.mjs';
import { downloadJson, safeFilename } from '../core/storage.mjs';
import { loadLocalSharedSubjects, normalizeBannerUrl, refreshSharedSubjectsMerged, saveLocalSharedSubjects } from './core.mjs';
import { getImage } from '../core/idb.mjs';
import { getCloudSessionInfo, getCloudSyncConfig } from '../sync/cloud-sync.mjs';
import { publishCloudSharedSubject } from './cloud.mjs';

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(blob);
  });
}

async function exportTopicImages(note) {
  const ids = Array.isArray(note?.images) ? note.images.map(String).filter(Boolean) : [];
  const images = [];

  for (const id of ids) {
    try {
      const blob = await getImage(id);
      if (!blob) continue;
      const dataUrl = await blobToDataUrl(blob);
      if (!dataUrl) continue;
      images.push({
        id,
        type: String(blob.type ?? ''),
        dataUrl
      });
    } catch {
      // ignore individual image failures
    }
  }

  return images;
}

export async function buildSharedSubjectPayload(subject, options = null) {
  if (!subject) return null;

  const categories = Array.isArray(subject.categories) ? subject.categories : [];
  const includeNotes = !!options?.includeNotes;
  const includeTopicNotes = !!options?.includeTopicNotes;
  const payload = {
    name: String(subject.name ?? '').trim() || 'Materia',
    icon: String(subject.icon ?? '').trim() || '📚',
    color: String(subject.color ?? '').trim() || '#667eea',
    bannerUrl: normalizeBannerUrl(subject.bannerUrl),
    categories: [],
    customAchievements: (Array.isArray(subject?.meta?.customAchievements) ? subject.meta.customAchievements : [])
      .filter((a) => a && typeof a === 'object')
      .filter((a) => String(a.type ?? '') !== 'category_complete')
      .map((a) => ({
        title: String(a.title ?? '').trim(),
        desc: String(a.desc ?? '').trim(),
        type: String(a.type ?? 'pct'),
        value: (a.value == null) ? null : Number(a.value)
      }))
      .filter((a) => a.title)
  };

  for (const category of categories) {
    const exportedCategory = {
      name: String(category?.name ?? '').trim() || 'Tema',
      icon: String(category?.icon ?? '').trim() || '📍',
      topics: []
    };

    const topics = Array.isArray(category?.topics) ? category.topics : [];
    for (const topic of topics) {
      const name = String(topic?.name ?? '').trim();
      if (!name) continue;

      const exportedTopic = {
        name,
        level: Math.max(1, Math.min(20, Number(topic?.level) || 1))
      };

      if (includeTopicNotes && topic?.note && typeof topic.note === 'object') {
        const text = String(topic.note.text ?? '');
        const images = await exportTopicImages(topic.note);
        if (text || images.length) {
          exportedTopic.note = { text, images };
        }
      }

      exportedCategory.topics.push(exportedTopic);
    }

    payload.categories.push(exportedCategory);
  }

  if (includeNotes) {
    ensureSubjectNotes(subject);
    payload.notes = {
      text: String(subject.notes?.text ?? ''),
      activeId: String(subject.notes?.activeId ?? ''),
      items: (Array.isArray(subject.notes?.items) ? subject.notes.items : [])
        .filter((n) => n && typeof n === 'object')
        .map((n) => ({
          id: String(n.id ?? ''),
          title: String(n.title ?? ''),
          content: String(n.content ?? ''),
          createdAt: (n.createdAt == null) ? null : Number(n.createdAt),
          updatedAt: (n.updatedAt == null) ? null : Number(n.updatedAt)
        }))
        .filter((n) => n.id && (n.title || n.content)),
      links: (Array.isArray(subject.notes?.links) ? subject.notes.links : [])
        .filter((l) => l && typeof l === 'object' && typeof l.url === 'string')
        .map((l) => ({ title: String(l.title ?? ''), url: String(l.url) }))
    };
  }

  return payload;
}

async function askSharedContentOptions() {
  const includeNotes = await showConfirmModalV2({
    title: 'Notas y links',
    text: 'Quieres incluir las notas y links utiles? Puede contener informacion personal.',
    confirmText: 'Incluir',
    cancelText: 'No incluir',
    fallbackText: 'Incluir notas y links?'
  });

  const includeTopicNotes = await showConfirmModalV2({
    title: 'Notas de temas y fotos',
    text: 'Quieres incluir notas de temas y sus imagenes? Esto puede hacer el archivo mas pesado.',
    confirmText: 'Incluir',
    cancelText: 'No incluir',
    fallbackText: 'Incluir notas de temas y fotos?'
  });

  return { includeNotes, includeTopicNotes };
}

export async function exportCurrentSubjectTemplate() {
  const subject = getCurrentSubject();
  if (!subject) {
    showNotification('Selecciona una materia primero');
    return;
  }

  const ok = await showConfirmModalV2({
    title: 'Exportar materia',
    text: `Esto exporta una plantilla de "${subject.name}". Puedes pegarla en shared-subjects.json para que aparezca en "Compartidas".`,
    confirmText: 'Exportar',
    cancelText: 'Cancelar',
    fallbackText: `Exportar "${subject.name}"?`
  });
  if (!ok) return;

  const payload = await buildSharedSubjectPayload(subject, await askSharedContentOptions());
  if (!payload) {
    showNotification('No se pudo preparar la materia.');
    return;
  }

  const pretty = JSON.stringify(payload, null, 2);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(pretty);
      showNotification('Copiado al portapapeles.');
    }
  } catch {
    // ignore
  }

  const filename = `shared-subject-${safeFilename(subject.name) || 'subject'}.json`;
  downloadJson(filename, payload);
}

function setSharedViewActive() {
  setActiveView('sharedView');
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === 'sharedView');
  });
}

function shareLocally(payload) {
  const sig = (() => {
    try {
      return JSON.stringify(payload);
    } catch {
      return null;
    }
  })();

  const local = loadLocalSharedSubjects();
  const already = local.some((s) => {
    try {
      return sig && JSON.stringify(s) === sig;
    } catch {
      return false;
    }
  });

  if (!already) {
    local.unshift(payload);
    setSharedSubjectsLocal(local);
    saveLocalSharedSubjects(getSharedSubjectsLocal());
    refreshSharedSubjectsMerged();
    setSharedSubjectsLoaded(true);
    setSharedSubjectsLoadError(null);
    renderSharedSubjects();
    showNotification('Materia agregada a compartidas.');
  } else {
    showNotification('Esa materia ya esta en compartidas.');
  }
}

export async function shareCurrentSubjectToShared() {
  const subject = getCurrentSubject();
  if (!subject) {
    showNotification('Selecciona una materia primero');
    return;
  }

  const ok = await showConfirmModalV2({
    title: 'Compartir materia',
    text: `Quieres compartir "${subject.name}"?`,
    confirmText: 'Continuar',
    cancelText: 'Cancelar',
    fallbackText: `Compartir "${subject.name}"?`
  });
  if (!ok) return;

  const payload = await buildSharedSubjectPayload(subject, await askSharedContentOptions());
  if (!payload) {
    showNotification('No se pudo preparar la materia.');
    return;
  }

  const session = getCloudSessionInfo();
  if (session) {
    const publishOnline = await showConfirmModalV2({
      title: 'Compartir online',
      text: 'Estas conectado. Quieres publicarla para que otros usuarios la vean en Compartidas?',
      confirmText: 'Publicar online',
      cancelText: 'Solo local',
      fallbackText: 'Publicar online?'
    });

    if (publishOnline) {
      try {
        const cfg = getCloudSyncConfig();
        await publishCloudSharedSubject({ payload, sessionToken: cfg?.sessionToken });
        showNotification('Materia publicada en Compartidas.');
        setSharedViewActive();
        const { loadSharedSubjects } = await import('./core.mjs');
        await loadSharedSubjects();
        return;
      } catch (e) {
        showNotification(String(e?.message ?? e ?? 'No se pudo publicar la materia.'));
        return;
      }
    }
  }

  shareLocally(payload);
  setSharedViewActive();
}
