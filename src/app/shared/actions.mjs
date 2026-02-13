import { showConfirmModalV2 } from '../ui/confirm-modal.mjs';
import { getCurrentSubject } from '../core/state.mjs';
import { getSharedSubjectsLocal, setSharedSubjectsLoaded, setSharedSubjectsLoadError, setSharedSubjectsLocal } from './state.mjs';
import { showNotification } from '../../utils/helpers.js';
import { ensureSubjectNotes } from '../features/notes/notes-skilltree-stats.mjs';
import { setActiveView } from '../ui/flow.mjs';
import { renderSharedSubjects } from './ui.mjs';
import { downloadJson, safeFilename } from '../core/storage.mjs';
import { loadLocalSharedSubjects, normalizeBannerUrl, refreshSharedSubjectsMerged, saveLocalSharedSubjects } from './core.mjs';

export function buildSharedSubjectPayload(subject, options = null) {
  if (!subject) return null;

  const categories = Array.isArray(subject.categories) ? subject.categories : [];
  const payload = {
    name: String(subject.name ?? '').trim() || 'Materia',
    icon: String(subject.icon ?? '').trim() || '📚',
    color: String(subject.color ?? '').trim() || '#667eea',
    bannerUrl: normalizeBannerUrl(subject.bannerUrl),
    categories: categories.map((c) => ({
      name: String(c?.name ?? '').trim() || 'Tema',
      icon: String(c?.icon ?? '').trim() || '📍',
      topics: (Array.isArray(c?.topics) ? c.topics : []).map((t) => ({
        name: String(t?.name ?? '').trim(),
        level: Math.max(1, Math.min(20, Number(t?.level) || 1))
      })).filter((t) => t.name)
    })),
    customAchievements: (Array.isArray(subject?.meta?.customAchievements) ? subject.meta.customAchievements : [])
      .filter((a) => a && typeof a === 'object')
      // Nota: category_complete requiere mapear IDs de categoría; por ahora lo omitimos en plantillas compartidas.
      .filter((a) => String(a.type ?? '') !== 'category_complete')
      .map((a) => ({
        title: String(a.title ?? '').trim(),
        desc: String(a.desc ?? '').trim(),
        type: String(a.type ?? 'pct'),
        value: (a.value == null) ? null : Number(a.value)
      }))
      .filter((a) => a.title)
  };

  const includeNotes = !!options?.includeNotes;
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

export async function exportCurrentSubjectTemplate() {
  const subject = getCurrentSubject();
  if (!subject) {
    showNotification('Selecciona una materia primero');
    return;
  }

  const ok = await showConfirmModalV2({
    title: 'Exportar materia',
    text: `Esto exporta una plantilla de "${subject.name}". Podés pegarla en shared-subjects.json para que aparezca en "Compartidas".`,
    confirmText: 'Exportar',
    cancelText: 'Cancelar',
    fallbackText: `¿Exportar "${subject.name}"?`
  });
  if (!ok) return;

  const includeNotes = await showConfirmModalV2({
    title: 'Notas y links',
    text: '¿Querés incluir las notas y links útiles en la exportación? (Puede contener info personal)',
    confirmText: 'Incluir',
    cancelText: 'No incluir',
    fallbackText: '¿Incluir notas y links?'
  });

  const payload = buildSharedSubjectPayload(subject, { includeNotes });
  if (!payload) {
    showNotification('No se pudo preparar la materia.');
    return;
  }

  const pretty = JSON.stringify(payload, null, 2);

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
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

export async function shareCurrentSubjectToShared() {
  const subject = getCurrentSubject();
  if (!subject) {
    showNotification('Selecciona una materia primero');
    return;
  }

  const ok = await showConfirmModalV2({
    title: 'Compartir materia',
    text: `Agregar "${subject.name}" a "Compartidas" en este dispositivo?`,
    confirmText: 'Agregar',
    cancelText: 'Cancelar',
    fallbackText: `Agregar "${subject.name}" a compartidas?`
  });
  if (!ok) return;

  const includeNotes = await showConfirmModalV2({
    title: 'Notas y links',
    text: '¿Querés incluir las notas y links útiles al compartir? (Puede contener info personal)',
    confirmText: 'Incluir',
    cancelText: 'No incluir',
    fallbackText: '¿Incluir notas y links?'
  });

  const payload = buildSharedSubjectPayload(subject, { includeNotes });
  if (!payload) {
    showNotification('No se pudo preparar la materia.');
    return;
  }

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
    showNotification('Esa materia ya está en compartidas.');
  }

  setSharedViewActive();
}
