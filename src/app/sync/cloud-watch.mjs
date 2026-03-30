import { showNotification } from '../../utils/helpers.js';
import { getStoredSyncPassphrase } from './auto-upload.mjs';
import { cloudDownloadEncryptedBackup, getCloudSessionInfo, getCloudSyncConfig } from './cloud-sync.mjs';

const SETTINGS_KEY = 'study-tracker:sync:cloud-watch:v1';
const STATE_KEY = 'study-tracker:sync:cloud-watch:state:v1';
const DIRTY_KEY = 'study-tracker:sync:cloud:dirty-since-ms';

let pollTimer = null;
let lastToastRemoteId = '';
let lastAutoPullToastRemoteId = '';

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function getCloudWatchSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  if (!parsed || typeof parsed !== 'object') {
    return { notifyRemoteChange: true, autoPullOnOpen: true, pollSec: 45 };
  }
  return {
    notifyRemoteChange: parsed.notifyRemoteChange !== false,
    autoPullOnOpen: parsed.autoPullOnOpen !== false,
    pollSec: Math.max(15, Math.min(600, Number(parsed.pollSec) || 45))
  };
}

export function setCloudWatchSettings(next) {
  const current = getCloudWatchSettings();
  const merged = { ...current, ...(next && typeof next === 'object' ? next : {}) };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    notifyRemoteChange: merged.notifyRemoteChange !== false,
    autoPullOnOpen: merged.autoPullOnOpen !== false,
    pollSec: Math.max(15, Math.min(600, Number(merged.pollSec) || 45))
  }));
  restartPolling();
  return getCloudWatchSettings();
}

function getWatchState() {
  const raw = localStorage.getItem(STATE_KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  if (!parsed || typeof parsed !== 'object') return { lastAppliedRemoteId: '', lastSeenRemoteId: '' };
  return {
    lastAppliedRemoteId: typeof parsed.lastAppliedRemoteId === 'string' ? parsed.lastAppliedRemoteId : '',
    lastSeenRemoteId: typeof parsed.lastSeenRemoteId === 'string' ? parsed.lastSeenRemoteId : ''
  };
}

function setWatchState(next) {
  const current = getWatchState();
  const merged = { ...current, ...(next && typeof next === 'object' ? next : {}) };
  localStorage.setItem(STATE_KEY, JSON.stringify({
    lastAppliedRemoteId: String(merged.lastAppliedRemoteId ?? ''),
    lastSeenRemoteId: String(merged.lastSeenRemoteId ?? '')
  }));
  try {
    document.dispatchEvent(new CustomEvent('cloud-watch-updated'));
  } catch {
    // ignore
  }
  return getWatchState();
}

function setBadge({ connected, upToDate, outdated }) {
  const el = document.getElementById('sidebarSyncBadge');
  if (!el) return;

  if (!connected) {
    el.hidden = true;
    el.textContent = '';
    el.classList.remove('sync-ok', 'sync-outdated');
    return;
  }

  el.hidden = false;
  el.classList.remove('sync-ok', 'sync-outdated');
  if (outdated) {
    el.textContent = 'Nube: desactualizado';
    el.classList.add('sync-outdated');
    return;
  }
  if (upToDate) {
    el.textContent = 'Nube: OK';
    el.classList.add('sync-ok');
    return;
  }
  el.textContent = 'Nube';
}

async function fetchLatestMeta() {
  const cfg = getCloudSyncConfig();
  const token = String(cfg.sessionToken ?? '').trim();
  if (!cfg.baseUrl || !token) return null;

  const url = `${String(cfg.baseUrl).replace(/\/+$/, '')}/api/backup/meta`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(String(json?.error ?? res.statusText ?? 'Error'));
  return json;
}

export function markAppliedRemoteId(id) {
  const rid = String(id ?? '').trim();
  if (!rid) return;
  setWatchState({ lastAppliedRemoteId: rid, lastSeenRemoteId: rid });
  try {
    localStorage.removeItem(DIRTY_KEY);
  } catch {
    // ignore
  }
}

function hasLocalUnsyncedChanges() {
  const v = Number(localStorage.getItem(DIRTY_KEY) || 0);
  return Number.isFinite(v) && v > 0;
}

export async function checkCloudNow({ allowAutoPull = false, quiet = false } = {}) {
  const session = getCloudSessionInfo();
  if (!session) {
    setBadge({ connected: false, upToDate: false, outdated: false });
    return null;
  }

  const state = getWatchState();
  let meta;
  try {
    meta = await fetchLatestMeta();
  } catch (e) {
    setBadge({ connected: true, upToDate: false, outdated: false });
    if (!quiet) showNotification(String(e?.message ?? e ?? 'No se pudo chequear la nube.'));
    return null;
  }

  if (!meta?.hasBackup) {
    setWatchState({ lastSeenRemoteId: '' });
    setBadge({ connected: true, upToDate: !hasLocalUnsyncedChanges(), outdated: false });
    return meta;
  }

  const remoteId = String(meta?.id ?? '').trim();
  if (remoteId) setWatchState({ lastSeenRemoteId: remoteId });

  const outdated = remoteId && remoteId !== String(state.lastAppliedRemoteId ?? '');
  const dirty = hasLocalUnsyncedChanges();

  setBadge({ connected: true, upToDate: !outdated, outdated });

  const settings = getCloudWatchSettings();
  if (outdated && settings.notifyRemoteChange && remoteId !== lastToastRemoteId) {
    lastToastRemoteId = remoteId;
    showNotification('Hay un backup más nuevo en la nube. Abrí Ajustes → Sincronización.');
  }

  if (allowAutoPull && outdated && settings.autoPullOnOpen && !dirty) {
    const passphrase = getStoredSyncPassphrase();
    if (!passphrase) {
      if (remoteId && remoteId !== lastAutoPullToastRemoteId) {
        lastAutoPullToastRemoteId = remoteId;
        showNotification('Hay un backup más nuevo, pero falta la clave (guardala en Ajustes).');
      }
      return meta;
    }
    if (remoteId && remoteId !== lastAutoPullToastRemoteId) {
      lastAutoPullToastRemoteId = remoteId;
      showNotification('Backup nuevo detectado. Descargando…');
    }
    try {
      const res = await cloudDownloadEncryptedBackup({ passphrase });
      if (res?.imported) markAppliedRemoteId(remoteId);
    } catch (e) {
      showNotification(String(e?.message ?? e ?? 'No se pudo descargar.'));
    }
  }

  return meta;
}

function restartPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  const session = getCloudSessionInfo();
  if (!session) {
    setBadge({ connected: false, upToDate: false, outdated: false });
    return;
  }

  const settings = getCloudWatchSettings();
  pollTimer = setInterval(() => {
    if (document.hidden) return;
    void checkCloudNow({ allowAutoPull: false, quiet: true });
  }, settings.pollSec * 1000);
}

export function initCloudWatch() {
  restartPolling();
  document.addEventListener('cloud-sync-updated', () => {
    lastToastRemoteId = '';
    lastAutoPullToastRemoteId = '';
    restartPolling();
    void checkCloudNow({ allowAutoPull: true, quiet: true });
  });
  document.addEventListener('cloud-watch-updated', () => {
    void checkCloudNow({ allowAutoPull: false, quiet: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void checkCloudNow({ allowAutoPull: false, quiet: true });
  });

  // On app start: check and optionally pull.
  void checkCloudNow({ allowAutoPull: true, quiet: true });
}
