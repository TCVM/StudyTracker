let pendingConfirmResolve = null;

function byId(id) {
  return document.getElementById(id);
}

export function showConfirmModalV2(options = null) {
  const confirmModal = byId('confirmModal');
  const confirmModalTitle = byId('confirmModalTitle');
  const confirmModalText = byId('confirmModalText');
  const confirmModalCloseBtn = byId('confirmModalCloseBtn');
  const confirmModalCancelBtn = byId('confirmModalCancelBtn');
  const confirmModalConfirmBtn = byId('confirmModalConfirmBtn');

  if (!confirmModal || !confirmModalConfirmBtn || !confirmModalCancelBtn || !confirmModalCloseBtn) {
    return Promise.resolve(confirm(options?.fallbackText ?? '¿Confirmar?'));
  }

  // If another confirm is open, resolve it as cancelled to avoid stacking handlers.
  if (pendingConfirmResolve) {
    try {
      pendingConfirmResolve(false);
    } catch {
      // ignore
    }
    pendingConfirmResolve = null;
    confirmModal.classList.remove('active');
  }

  const title = options?.title ?? 'Confirmar';
  const text = options?.text ?? '¿Estás seguro?';
  const confirmText = options?.confirmText ?? 'Confirmar';
  const cancelText = options?.cancelText ?? 'Cancelar';

  if (confirmModalTitle) confirmModalTitle.textContent = title;
  if (confirmModalText) confirmModalText.textContent = text;
  confirmModalConfirmBtn.textContent = confirmText;
  confirmModalCancelBtn.textContent = cancelText;

  confirmModal.classList.add('active');

  return new Promise((resolve) => {
    pendingConfirmResolve = resolve;

    const cleanup = (value) => {
      confirmModalCancelBtn.removeEventListener('click', onCancel);
      confirmModalConfirmBtn.removeEventListener('click', onConfirm);
      confirmModalCloseBtn.removeEventListener('click', onClose);
      confirmModal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKeydown);

      if (!pendingConfirmResolve) return;
      pendingConfirmResolve = null;
      confirmModal.classList.remove('active');
      resolve(value);
    };

    const onCancel = () => cleanup(false);
    const onConfirm = () => cleanup(true);
    const onClose = () => cleanup(false);
    const onBackdrop = (e) => {
      if (e.target === confirmModal) cleanup(false);
    };
    const onKeydown = (e) => {
      if (e.key === 'Escape') cleanup(false);
    };

    confirmModalCancelBtn.addEventListener('click', onCancel);
    confirmModalConfirmBtn.addEventListener('click', onConfirm);
    confirmModalCloseBtn.addEventListener('click', onClose);
    confirmModal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeydown);

    try {
      confirmModalConfirmBtn.focus();
    } catch {
      // ignore
    }
  });
}

