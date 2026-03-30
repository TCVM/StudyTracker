import { showNotification } from '../../utils/helpers.js';
import { getCloudSessionInfo } from './cloud-sync.mjs';

const SETTINGS_KEY = 'study-tracker:sync:auto:v1';
const SESSION_PASSPHRASE_KEY = 'study-tracker:sync:passphrase:session';
const REMEMBER_PASSPHRASE_KEY = 'study-tracker:sync:passphrase:remembered';

let pendingUploadTimer = null;
let periodicTimer = null;
let dirtySinceMs = 0;
let lastWarnAtMs = 0;

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function getAutoSyncSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  if (!parsed || typeof parsed !== 'object') {
    return { onSave: false, intervalMin: 0 };
  }

  return {
    onSave: !!parsed.onSave,
    intervalMin: Math.max(0, Math.min(120, Number(parsed.intervalMin) || 0))
  };
}

export function setAutoSyncSettings(next) {
  const current = getAutoSyncSettings();
  const merged = { ...current, ...(next && typeof next === 'object' ? next : {}) };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    onSave: !!merged.onSave,
    intervalMin: Math.max(0, Math.min(120, Number(merged.intervalMin) || 0))
  }));
  ensurePeriodicTimer();
  return getAutoSyncSettings();
}

export function getStoredSyncPassphrase() {
  const session = sessionStorage.getItem(SESSION_PASSPHRASE_KEY);
  if (session) return session;
  const remembered = localStorage.getItem(REMEMBER_PASSPHRASE_KEY);
  return remembered || '';
}

export function setStoredSyncPassphrase(passphrase, { remember = false } = {}) {
  const p = String(passphrase ?? '');
  if (!p) {
    sessionStorage.removeItem(SESSION_PASSPHRASE_KEY);
    localStorage.removeItem(REMEMBER_PASSPHRASE_KEY);
    return;
  }

  sessionStorage.setItem(SESSION_PASSPHRASE_KEY, p);
  if (remember) localStorage.setItem(REMEMBER_PASSPHRASE_KEY, p);
  else localStorage.removeItem(REMEMBER_PASSPHRASE_KEY);
}

async function doUpload({ reason }) {
  const session = getCloudSessionInfo();
  if (!session) return;

  const passphrase = getStoredSyncPassphrase();
  if (!passphrase) {
    const now = Date.now();
    if (now - lastWarnAtMs > 60_000) {
      lastWarnAtMs = now;
      showNotification('Auto-sync: falta clave de cifrado (guardala en Ajustes).');
    }
    return;
  }

  try {
    const mod = await import('./cloud-sync.mjs');
    const res = await mod.cloudUploadEncryptedBackup({ passphrase });
    try {
      const watch = await import('./cloud-watch.mjs');
      if (res?.id) watch.markAppliedRemoteId?.(res.id);
    } catch {
      // ignore
    }
    dirtySinceMs = 0;
    if (reason === 'interval') {
      // keep silent
    }
  } catch (e) {
    const now = Date.now();
    if (now - lastWarnAtMs > 90_000) {
      lastWarnAtMs = now;
      showNotification(`Auto-sync falló: ${String(e?.message ?? e ?? 'error')}`);
    }
  }
}

export function notifyLocalSave() {
  dirtySinceMs = dirtySinceMs || Date.now();
  const settings = getAutoSyncSettings();
  if (!settings.onSave) return;

  if (pendingUploadTimer) clearTimeout(pendingUploadTimer);
  pendingUploadTimer = setTimeout(() => {
    pendingUploadTimer = null;
    void doUpload({ reason: 'save' });
  }, 25_000);
}

export function ensurePeriodicTimer() {
  const settings = getAutoSyncSettings();
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }

  if (!settings.intervalMin) return;

  periodicTimer = setInterval(() => {
    if (!dirtySinceMs) return;
    void doUpload({ reason: 'interval' });
  }, settings.intervalMin * 60_000);
}

ensurePeriodicTimer();
