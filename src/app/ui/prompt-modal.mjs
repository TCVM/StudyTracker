let pendingPromptResolve = null;

function byId(id) {
  return document.getElementById(id);
}

function ensurePromptModal() {
  if (byId('promptModal')) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'promptModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'promptModalTitle');

  modal.innerHTML = `
    <div class="modal-content modal-content-sm">
      <div class="modal-header">
        <h3 id="promptModalTitle">Ingresar</h3>
        <button class="modal-close" id="promptModalCloseBtn" type="button" aria-label="Cerrar">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label id="promptModalLabel" for="promptModalInput">Valor</label>
          <input id="promptModalInput" class="form-control" type="text" />
        </div>
        <div class="exam-date-preview" id="promptModalHint" hidden></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="promptModalCancelBtn" type="button">Cancelar</button>
        <button class="btn btn-primary" id="promptModalConfirmBtn" type="button">Aceptar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

export function showPromptModal(options = null) {
  ensurePromptModal();

  const modal = byId('promptModal');
  const titleEl = byId('promptModalTitle');
  const labelEl = byId('promptModalLabel');
  const inputEl = byId('promptModalInput');
  const hintEl = byId('promptModalHint');
  const closeBtn = byId('promptModalCloseBtn');
  const cancelBtn = byId('promptModalCancelBtn');
  const confirmBtn = byId('promptModalConfirmBtn');

  if (!modal || !inputEl || !cancelBtn || !confirmBtn || !closeBtn) {
    // fallback
    const res = prompt(options?.fallbackText ?? options?.label ?? 'Ingresar valor', options?.defaultValue ?? '');
    return Promise.resolve(res == null ? null : String(res));
  }

  // If another prompt is open, resolve it as cancelled.
  if (pendingPromptResolve) {
    try {
      pendingPromptResolve(null);
    } catch {
      // ignore
    }
    pendingPromptResolve = null;
    modal.classList.remove('active');
  }

  const title = options?.title ?? 'Ingresar';
  const label = options?.label ?? 'Valor';
  const placeholder = options?.placeholder ?? '';
  const defaultValue = options?.defaultValue ?? '';
  const confirmText = options?.confirmText ?? 'Aceptar';
  const cancelText = options?.cancelText ?? 'Cancelar';
  const hint = options?.hint ?? '';
  const inputType = options?.inputType ?? 'text';

  if (titleEl) titleEl.textContent = title;
  if (labelEl) labelEl.textContent = label;
  inputEl.type = inputType;
  inputEl.placeholder = placeholder;
  inputEl.value = String(defaultValue);
  confirmBtn.textContent = confirmText;
  cancelBtn.textContent = cancelText;

  if (hintEl) {
    if (hint) {
      hintEl.hidden = false;
      hintEl.textContent = hint;
    } else {
      hintEl.hidden = true;
      hintEl.textContent = '';
    }
  }

  modal.classList.add('active');

  return new Promise((resolve) => {
    pendingPromptResolve = resolve;

    const cleanup = (value) => {
      cancelBtn.removeEventListener('click', onCancel);
      confirmBtn.removeEventListener('click', onConfirm);
      closeBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKeydown);

      if (!pendingPromptResolve) return;
      pendingPromptResolve = null;
      modal.classList.remove('active');
      resolve(value);
    };

    const onCancel = () => cleanup(null);
    const onConfirm = () => cleanup(String(inputEl.value ?? ''));
    const onBackdrop = (e) => {
      if (e.target === modal) cleanup(null);
    };
    const onKeydown = (e) => {
      if (e.key === 'Escape') cleanup(null);
      if (e.key === 'Enter') cleanup(String(inputEl.value ?? ''));
    };

    cancelBtn.addEventListener('click', onCancel);
    confirmBtn.addEventListener('click', onConfirm);
    closeBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeydown);

    try {
      inputEl.focus();
      inputEl.select?.();
    } catch {
      // ignore
    }
  });
}