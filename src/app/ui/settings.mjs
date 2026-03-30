import { showNotification } from '../../utils/helpers.js';
import {
  buildCloudAuthStartUrl,
  cloudDownloadBackupById,
  cloudDownloadEncryptedBackup,
  cloudListBackups,
  cloudUploadEncryptedBackup,
  getCloudSyncConfig,
  getCloudSessionInfo
} from '../sync/cloud-sync.mjs';
import { showConfirmModalV2 } from './confirm-modal.mjs';
import { showPromptModal } from './prompt-modal.mjs';
import { getAutoSyncSettings, getStoredSyncPassphrase, setAutoSyncSettings, setStoredSyncPassphrase } from '../sync/auto-upload.mjs';

function byId(id) {
  return document.getElementById(id);
}

function setDisabled(id, disabled) {
  const el = byId(id);
  if (el) el.disabled = !!disabled;
}

function setText(id, text) {
  const el = byId(id);
  if (el) el.textContent = String(text ?? '');
}

function ensureSelectOption(select, value, label) {
  const opt = document.createElement('option');
  opt.value = String(value ?? '');
  opt.textContent = String(label ?? value ?? '');
  select.appendChild(opt);
}

async function withBusy(ids, fn) {
  const unique = [...new Set((ids || []).map(String).filter(Boolean))];
  for (const id of unique) setDisabled(id, true);
  try {
    return await fn();
  } finally {
    for (const id of unique) setDisabled(id, false);
  }
}

async function getPassphraseFromSettingsOrPrompt() {
  const input = byId('settingsSyncPassphrase');
  const fromInput = String(input?.value ?? '').trim();
  if (fromInput) return fromInput;

  const res = await showPromptModal({
    title: 'Clave de cifrado',
    label: 'Contraseña (no se guarda por defecto)',
    inputType: 'password'
  });
  if (res == null) return null;
  const p = String(res).trim();
  if (!p) {
    showNotification('Clave vacía.');
    return null;
  }
  return p;
}

async function refreshHistorySelect() {
  const select = byId('settingsSyncHistorySelect');
  if (!select) return;

  select.innerHTML = '';
  ensureSelectOption(select, '', '—');

  try {
    const list = await cloudListBackups({ limit: 10 });
    const items = Array.isArray(list?.items) ? list.items : [];
    for (const it of items) {
      const id = String(it?.id ?? '').trim();
      const when = String(it?.updatedAt ?? '').trim();
      if (!id) continue;
      ensureSelectOption(select, id, when ? `${when} (${id})` : id);
    }
    if (items.length === 0) {
      ensureSelectOption(select, '', 'Sin backups todavía');
    }
  } catch (e) {
    const msg = String(e?.message ?? e ?? 'No se pudo obtener historial.');
    if (msg.toLowerCase().includes('not found')) {
      ensureSelectOption(select, '', 'Tu backend no tiene historial (actualizá el Worker)');
    }
    showNotification(msg);
  }
}

function renderSettings() {
  const session = getCloudSessionInfo();
  const status = session?.login ? `Conectado como @${session.login}` : (session ? 'Conectado' : 'No conectado');
  setText('settingsSyncStatus', `Estado: ${status}`);

  const connected = !!session;
  setDisabled('settingsSyncConnectBtn', connected);
  setDisabled('settingsSyncLogoutBtn', !connected);
  setDisabled('settingsSyncUploadBtn', !connected);
  setDisabled('settingsSyncDownloadBtn', !connected);
  setDisabled('settingsSyncHistoryRefreshBtn', !connected);
  setDisabled('settingsSyncHistoryRestoreBtn', !connected);

  const auto = getAutoSyncSettings();
  const onSave = byId('settingsAutoSyncOnSave');
  if (onSave) onSave.checked = !!auto.onSave;
  const interval = byId('settingsAutoSyncIntervalMin');
  if (interval) interval.value = String(auto.intervalMin ?? 0);

  const storedPass = getStoredSyncPassphrase();
  const passInput = byId('settingsSyncPassphrase');
  if (passInput && storedPass && !passInput.value) passInput.value = storedPass;

  const remember = byId('settingsSyncRememberPassphrase');
  if (remember) remember.checked = !!localStorage.getItem('study-tracker:sync:passphrase:remembered');
}

let settingsBound = false;
export function ensureSettingsUi() {
  if (settingsBound) return;
  settingsBound = true;

  document.addEventListener('cloud-sync-updated', () => {
    try {
      renderSettings();
    } catch {
      // ignore
    }
  });

  const connectBtn = byId('settingsSyncConnectBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      const session = getCloudSessionInfo();
      if (session?.login) {
        showNotification(`Ya estás conectado como @${session.login}.`);
        return;
      }
      if (session) {
        showNotification('Ya estás conectado.');
        return;
      }

      const cfg = getCloudSyncConfig();
      if (!cfg.baseUrl) {
        showNotification('Falta configurar el servidor de Sync (meta tag).');
        return;
      }

      let loginUrl;
      try {
        loginUrl = buildCloudAuthStartUrl({ baseUrl: cfg.baseUrl, redirectUrl: window.location.href });
      } catch (e) {
        showNotification(String(e?.message ?? e ?? 'URL inválida.'));
        return;
      }

      const ok = await showConfirmModalV2({
        title: 'Conectar con GitHub',
        text: 'Vas a ser redirigido a GitHub para iniciar sesión y autorizar el Sync.',
        confirmText: 'Continuar',
        cancelText: 'Cancelar',
        fallbackText: '¿Conectar con GitHub para Sync?'
      });
      if (!ok) return;

      showNotification('Redirigiendo a GitHub…');
      window.location.assign(loginUrl);
    });
  }

  const logoutBtn = byId('settingsSyncLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const ok = await showConfirmModalV2({
        title: 'Cerrar sesión',
        text: 'Esto desconecta la cuenta en este dispositivo.',
        confirmText: 'Cerrar sesión',
        cancelText: 'Cancelar',
        fallbackText: '¿Cerrar sesión?'
      });
      if (!ok) return;
      const mod = await import('../sync/cloud-sync.mjs');
      mod.clearCloudSyncSession?.();
      renderSettings();
      showNotification('Sesión cerrada.');
    });
  }

  const uploadBtn = byId('settingsSyncUploadBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
      const passphrase = await getPassphraseFromSettingsOrPrompt();
      if (!passphrase) return;
      await withBusy(['settingsSyncUploadBtn', 'settingsSyncDownloadBtn', 'settingsSyncHistoryRestoreBtn'], async () => {
        showNotification('Subiendo backup…');
        try {
          const res = await cloudUploadEncryptedBackup({ passphrase });
          showNotification(`Backup subido (${res?.updatedAt ?? 'ok'}).`);
          await refreshHistorySelect();
        } catch (e) {
          showNotification(String(e?.message ?? e ?? 'Error al subir.'));
        }
      });
    });
  }

  const downloadBtn = byId('settingsSyncDownloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      const passphrase = await getPassphraseFromSettingsOrPrompt();
      if (!passphrase) return;
      await withBusy(['settingsSyncUploadBtn', 'settingsSyncDownloadBtn', 'settingsSyncHistoryRestoreBtn'], async () => {
        showNotification('Descargando backup…');
        try {
          await cloudDownloadEncryptedBackup({ passphrase });
          showNotification('Backup descargado.');
        } catch (e) {
          showNotification(String(e?.message ?? e ?? 'Error al bajar.'));
        }
      });
    });
  }

  const refreshBtn = byId('settingsSyncHistoryRefreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => void refreshHistorySelect());

  const restoreBtn = byId('settingsSyncHistoryRestoreBtn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      const select = byId('settingsSyncHistorySelect');
      const id = String(select?.value ?? '').trim();
      if (!id) {
        showNotification('Elegí un backup.');
        return;
      }
      const passphrase = await getPassphraseFromSettingsOrPrompt();
      if (!passphrase) return;
      await withBusy(['settingsSyncUploadBtn', 'settingsSyncDownloadBtn', 'settingsSyncHistoryRestoreBtn'], async () => {
        showNotification('Descargando backup del historial…');
        try {
          await cloudDownloadBackupById({ id, passphrase });
          showNotification('Backup restaurado.');
        } catch (e) {
          showNotification(String(e?.message ?? e ?? 'Error al restaurar.'));
        }
      });
    });
  }

  const autoOnSave = byId('settingsAutoSyncOnSave');
  if (autoOnSave) {
    autoOnSave.addEventListener('change', () => {
      setAutoSyncSettings({ onSave: !!autoOnSave.checked });
      showNotification(autoOnSave.checked ? 'Auto-sync al guardar: activado.' : 'Auto-sync al guardar: desactivado.');
    });
  }

  const intervalMin = byId('settingsAutoSyncIntervalMin');
  if (intervalMin) {
    intervalMin.addEventListener('change', () => {
      const v = Math.max(0, Math.min(120, parseInt(String(intervalMin.value || '0'), 10) || 0));
      intervalMin.value = String(v);
      setAutoSyncSettings({ intervalMin: v });
      showNotification(v ? `Auto-sync cada ${v} min: activado.` : 'Auto-sync por intervalo: desactivado.');
    });
  }

  const savePassBtn = byId('settingsSyncSavePassphraseBtn');
  if (savePassBtn) {
    savePassBtn.addEventListener('click', () => {
      const passphrase = String(byId('settingsSyncPassphrase')?.value ?? '').trim();
      const remember = !!byId('settingsSyncRememberPassphrase')?.checked;
      if (!passphrase) {
        setStoredSyncPassphrase('', { remember: false });
        showNotification('Clave borrada de este dispositivo.');
        return;
      }
      setStoredSyncPassphrase(passphrase, { remember });
      showNotification(remember ? 'Clave guardada (persistente).' : 'Clave guardada (solo esta sesión).');
    });
  }

  // quickOpenSettings is wired from events.mjs so it works before visiting settings.
}

export async function activateSettingsView() {
  ensureSettingsUi();
  renderSettings();
  await refreshHistorySelect();
}
