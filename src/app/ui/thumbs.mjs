import { getImage } from '../core/idb.mjs';
import { openImageViewer } from './image-viewer.mjs';

function parseIds(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // ignore
  }
  return [];
}

export async function hydrateThumbs(root, selector) {
  if (!(root instanceof Element)) return;

  const containers = Array.from(root.querySelectorAll(selector));
  for (const el of containers) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.dataset.hydrated === '1') continue;
    el.dataset.hydrated = '1';

    const ids = parseIds(el.dataset.imageIds);
    if (!ids.length) {
      el.innerHTML = '';
      continue;
    }

    const limit = Math.max(1, Math.min(6, Number(el.dataset.limit) || 3));
    const show = ids.slice(0, limit);

    for (const id of show) {
      const blob = await getImage(id);
      if (!blob) continue;

      const url = URL.createObjectURL(blob);
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Imagen';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openImageViewer(url, { title: 'Imagen', alt: 'Imagen' });
      });

      // Revoke when the img gets removed.
      const obs = new MutationObserver(() => {
        if (!img.isConnected) {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
          obs.disconnect();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });

      el.appendChild(img);
    }

    if (ids.length > show.length) {
      const more = document.createElement('span');
      more.className = 'answer-thumbs-more';
      more.textContent = `+${ids.length - show.length}`;
      el.appendChild(more);
    }
  }
}

