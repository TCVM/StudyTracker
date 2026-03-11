function byId(id) {
  return document.getElementById(id);
}

let isSetup = false;
let isZoomed = false;
let drag = null; // { startX, startY, scrollLeft, scrollTop }

function setZoom(next) {
  isZoomed = !!next;
  const modal = byId('imageViewerModal');
  const img = byId('imageViewerImg');
  const zoomBtn = byId('imageViewerZoomBtn');
  if (modal) modal.classList.toggle('image-viewer-zoomed', isZoomed);
  if (zoomBtn) zoomBtn.textContent = isZoomed ? 'Ajustar' : '1:1';
  if (img) img.classList.remove('grabbing');
  drag = null;
}

export function openImageViewer(src, options = null) {
  const modal = byId('imageViewerModal');
  const img = byId('imageViewerImg');
  const title = byId('imageViewerModalTitle');
  if (!modal || !img) return;

  img.src = String(src ?? '');
  img.alt = String(options?.alt ?? 'Imagen ampliada');
  if (title) title.textContent = String(options?.title ?? 'Imagen');

  setZoom(false);
  modal.classList.add('active');
}

export function closeImageViewer() {
  const modal = byId('imageViewerModal');
  const img = byId('imageViewerImg');
  if (!modal || !img) return;
  modal.classList.remove('active');
  img.removeAttribute('src');
  setZoom(false);
}

export function setupImageViewer() {
  if (isSetup) return;
  isSetup = true;

  const modal = byId('imageViewerModal');
  const closeX = byId('closeImageViewerModal');
  const closeBtn = byId('imageViewerCloseBtn');
  const img = byId('imageViewerImg');
  const zoomBtn = byId('imageViewerZoomBtn');
  const body = modal?.querySelector?.('.image-viewer-body') ?? null;

  const close = () => closeImageViewer();

  closeX?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) close();
  });

  // prevent dragging ghost image on desktop
  img?.addEventListener('dragstart', (e) => e.preventDefault());

  zoomBtn?.addEventListener('click', () => setZoom(!isZoomed));

  img?.addEventListener('click', () => setZoom(!isZoomed));

  // Drag to pan (WhatsApp-like) when zoomed
  const onDown = (e) => {
    if (!isZoomed || !body) return;
    if (!(e.target instanceof Element)) return;
    if (!e.target.closest?.('#imageViewerImg')) return;
    drag = { startX: e.clientX, startY: e.clientY, scrollLeft: body.scrollLeft, scrollTop: body.scrollTop };
    try {
      img?.classList?.add?.('grabbing');
    } catch {
      // ignore
    }
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!drag || !isZoomed || !body) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    body.scrollLeft = drag.scrollLeft - dx;
    body.scrollTop = drag.scrollTop - dy;
  };

  const onUp = () => {
    drag = null;
    try {
      img?.classList?.remove?.('grabbing');
    } catch {
      // ignore
    }
  };

  img?.addEventListener('pointerdown', onDown);
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}
