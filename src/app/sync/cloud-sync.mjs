import { buildBackupPayload, importBackupText } from '../core/storage.mjs';
import { decryptStringWithPassphrase, encryptStringWithPassphrase } from './crypto.mjs';

const CONFIG_KEY = 'study-tracker:sync:cloud:v1';

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeBaseUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  const withScheme = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
}

export function getCloudSyncConfig() {
  const raw = localStorage.getItem(CONFIG_KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  if (!parsed || typeof parsed !== 'object') {
    return { baseUrl: '', sessionToken: '' };
  }
  return {
    baseUrl: typeof parsed.baseUrl === 'string' ? normalizeBaseUrl(parsed.baseUrl) : '',
    sessionToken: typeof parsed.sessionToken === 'string' ? parsed.sessionToken : ''
  };
}

export function setCloudSyncConfig(next) {
  const current = getCloudSyncConfig();
  const merged = { ...current, ...(next && typeof next === 'object' ? next : {}) };
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    baseUrl: normalizeBaseUrl(merged.baseUrl),
    sessionToken: String(merged.sessionToken ?? '')
  }));
  return getCloudSyncConfig();
}

export function clearCloudSyncSession() {
  const current = getCloudSyncConfig();
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    baseUrl: String(current.baseUrl ?? ''),
    sessionToken: ''
  }));
}

export function claimCloudSyncTokenFromUrl() {
  const u = new URL(window.location.href);
  const token = u.searchParams.get('sync_token');
  if (!token) return false;
  setCloudSyncConfig({ sessionToken: token });
  u.searchParams.delete('sync_token');
  window.history.replaceState({}, '', u.toString());
  return true;
}

export function buildCloudAuthStartUrl({ baseUrl, redirectUrl }) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) throw new Error('Falta la URL del servidor de sync.');
  const url = new URL('/auth/github/start', base);
  url.searchParams.set('redirect', String(redirectUrl ?? window.location.href));
  return url.toString();
}

async function apiJson({ baseUrl, path, method, sessionToken, body }) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) throw new Error('Falta la URL del servidor de sync.');
  const url = `${base}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`
    },
    body: body ? JSON.stringify(body) : null
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = String(json?.error ?? res.statusText ?? 'Error');
    throw new Error(err);
  }
  return json;
}

export async function cloudUploadEncryptedBackup({ passphrase }) {
  const cfg = getCloudSyncConfig();
  const token = String(cfg.sessionToken ?? '').trim();
  if (!token) throw new Error('No conectado. Usá “Conectar” primero.');

  const backupText = JSON.stringify(buildBackupPayload());
  const encryptedText = await encryptStringWithPassphrase(backupText, passphrase);

  const json = await apiJson({
    baseUrl: cfg.baseUrl,
    path: '/api/backup',
    method: 'POST',
    sessionToken: token,
    body: { encryptedText }
  });
  return json;
}

export async function cloudDownloadEncryptedBackup({ passphrase }) {
  const cfg = getCloudSyncConfig();
  const token = String(cfg.sessionToken ?? '').trim();
  if (!token) throw new Error('No conectado. Usá “Conectar” primero.');

  const json = await apiJson({
    baseUrl: cfg.baseUrl,
    path: '/api/backup',
    method: 'GET',
    sessionToken: token,
    body: null
  });

  if (!json?.hasBackup) {
    throw new Error('No hay backup en la nube todavía.');
  }

  const encryptedText = String(json?.encryptedText ?? '').trim();
  if (!encryptedText) throw new Error('Backup inválido.');

  const plainText = await decryptStringWithPassphrase(encryptedText, passphrase);
  await importBackupText(plainText);
  return json;
}
