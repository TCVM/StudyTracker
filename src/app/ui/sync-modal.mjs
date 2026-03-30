let pendingResolve = null;

function byId(id) {
  return document.getElementById(id);
}

function ensureSyncModal() {
  if (byId('syncModal')) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'syncModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'syncModalTitle');

  modal.innerHTML = `
    <div class="modal-content modal-content-sm">
      <div class="modal-header">
        <h3 id="syncModalTitle">Sincronización</h3>
        <button class="modal-close" id="syncModalCloseBtn" type="button" aria-label="Cerrar">×</button>
      </div>
      <div class="modal-body">
        <div class="exam-date-preview" id="syncModalStatus"></div>
        <div class="actions-grid" style="margin-top: 14px;">
          <button class="btn btn-secondary" id="syncModalSetupBtn" type="button">Conectar</button>
          <button class="btn btn-primary" id="syncModalUploadBtn" type="button">Subir (crear/actualizar)</button>
          <button class="btn btn-secondary" id="syncModalDownloadBtn" type="button">Bajar backup</button>
          <button class="btn btn-secondary" id="syncModalHistoryBtn" type="button">Historial</button>
          <button class="btn btn-secondary" id="syncModalLogoutBtn" type="button">Cerrar sesión</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

export function showSyncModal(options = null) {
  ensureSyncModal();

  const modal = byId('syncModal');
  const titleEl = byId('syncModalTitle');
  const statusEl = byId('syncModalStatus');
  const closeBtn = byId('syncModalCloseBtn');
  const setupBtn = byId('syncModalSetupBtn');
  const uploadBtn = byId('syncModalUploadBtn');
  const downloadBtn = byId('syncModalDownloadBtn');
  const historyBtn = byId('syncModalHistoryBtn');
  const logoutBtn = byId('syncModalLogoutBtn');

  if (!modal || !closeBtn || !setupBtn || !uploadBtn || !downloadBtn || !historyBtn || !logoutBtn) {
    return Promise.resolve(null);
  }

  if (pendingResolve) {
    try {
      pendingResolve(null);
    } catch {
      // ignore
    }
    pendingResolve = null;
    modal.classList.remove('active');
  }

  const title = options?.title ?? 'Sincronización (Cloud)';
  const status = options?.status ?? '';

  if (titleEl) titleEl.textContent = title;
  if (statusEl) statusEl.textContent = status;

  modal.classList.add('active');

  return new Promise((resolve) => {
    pendingResolve = resolve;

    const cleanup = (value) => {
      setupBtn.removeEventListener('click', onSetup);
      uploadBtn.removeEventListener('click', onUpload);
      downloadBtn.removeEventListener('click', onDownload);
      historyBtn.removeEventListener('click', onHistory);
      logoutBtn.removeEventListener('click', onLogout);
      closeBtn.removeEventListener('click', onClose);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKeydown);

      if (!pendingResolve) return;
      pendingResolve = null;
      modal.classList.remove('active');
      resolve(value);
    };

    const onSetup = () => cleanup('setup');
    const onUpload = () => cleanup('upload');
    const onDownload = () => cleanup('download');
    const onHistory = () => cleanup('history');
    const onLogout = () => cleanup('logout');
    const onClose = () => cleanup(null);
    const onBackdrop = (e) => {
      if (e.target === modal) cleanup(null);
    };
    const onKeydown = (e) => {
      if (e.key === 'Escape') cleanup(null);
    };

    setupBtn.addEventListener('click', onSetup);
    uploadBtn.addEventListener('click', onUpload);
    downloadBtn.addEventListener('click', onDownload);
    historyBtn.addEventListener('click', onHistory);
    logoutBtn.addEventListener('click', onLogout);
    closeBtn.addEventListener('click', onClose);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeydown);

    try {
      uploadBtn.focus();
    } catch {
      // ignore
    }
  });
}
