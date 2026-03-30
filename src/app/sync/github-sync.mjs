import { buildBackupPayload, importBackupText } from '../core/storage.mjs';
import { decryptStringWithPassphrase, encryptStringWithPassphrase } from './crypto.mjs';
import {
  createEncryptedBackupGist,
  fetchEncryptedBackupFromGist,
  updateEncryptedBackupGist
} from './github-gist.mjs';
import { pollGitHubDeviceAccessToken, requestGitHubDeviceCode } from './github-device-flow.mjs';

const CONFIG_KEY = 'study-tracker:sync:github-gist:v1';
const DEFAULT_FILENAME = 'study-tracker-backup.enc.json';

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function getGitHubGistSyncConfig() {
  const raw = localStorage.getItem(CONFIG_KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  if (!parsed || typeof parsed !== 'object') {
    return { token: '', gistId: '', filename: DEFAULT_FILENAME, clientId: '', proxyBaseUrl: '' };
  }

  return {
    token: typeof parsed.token === 'string' ? parsed.token : '',
    gistId: typeof parsed.gistId === 'string' ? parsed.gistId : '',
    filename: typeof parsed.filename === 'string' && parsed.filename.trim() ? parsed.filename : DEFAULT_FILENAME,
    clientId: typeof parsed.clientId === 'string' ? parsed.clientId : '',
    proxyBaseUrl: typeof parsed.proxyBaseUrl === 'string' ? parsed.proxyBaseUrl : ''
  };
}

export function setGitHubGistSyncConfig(next) {
  const current = getGitHubGistSyncConfig();
  const merged = {
    ...current,
    ...(next && typeof next === 'object' ? next : {})
  };

  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    token: String(merged.token ?? ''),
    gistId: String(merged.gistId ?? ''),
    filename: String(merged.filename ?? DEFAULT_FILENAME),
    clientId: String(merged.clientId ?? ''),
    proxyBaseUrl: String(merged.proxyBaseUrl ?? '')
  }));

  return getGitHubGistSyncConfig();
}

export function clearGitHubGistSyncConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

export async function uploadEncryptedBackupToGitHubGist({ token, passphrase } = {}) {
  const cfg = getGitHubGistSyncConfig();
  const t = String(token ?? cfg.token ?? '').trim();
  if (!t) throw new Error('Falta el GitHub token.');

  const p = String(passphrase ?? '').trim();
  if (!p) throw new Error('Falta la contraseña.');

  const filename = cfg.filename || DEFAULT_FILENAME;
  const backupText = JSON.stringify(buildBackupPayload());
  const encryptedText = await encryptStringWithPassphrase(backupText, p);

  let res;
  if (cfg.gistId) {
    res = await updateEncryptedBackupGist({ token: t, gistId: cfg.gistId, filename, content: encryptedText });
  } else {
    res = await createEncryptedBackupGist({ token: t, filename, content: encryptedText });
  }

  setGitHubGistSyncConfig({ token: t, gistId: res.gistId, filename });
  return res;
}

export async function downloadEncryptedBackupFromGitHubGist({ token, passphrase, gistId } = {}) {
  const cfg = getGitHubGistSyncConfig();
  const t = String(token ?? cfg.token ?? '').trim();
  if (!t) throw new Error('Falta el GitHub token.');

  const p = String(passphrase ?? '').trim();
  if (!p) throw new Error('Falta la contraseña.');

  const gid = String(gistId ?? cfg.gistId ?? '').trim();
  if (!gid) throw new Error('Falta el Gist ID. Primero subí un backup o pegá el ID.');

  const filename = cfg.filename || DEFAULT_FILENAME;
  const encryptedText = await fetchEncryptedBackupFromGist({ token: t, gistId: gid, filename });
  const plainText = await decryptStringWithPassphrase(encryptedText, p);

  await importBackupText(plainText);
  setGitHubGistSyncConfig({ token: t, gistId: gid, filename });
  return { gistId: gid };
}

export async function startGitHubDeviceFlow({ clientId, scope = 'gist' } = {}) {
  const cfg = getGitHubGistSyncConfig();
  const cid = String(clientId ?? cfg.clientId ?? '').trim();
  if (!cid) throw new Error('Falta el Client ID del OAuth App.');

  const device = await requestGitHubDeviceCode({ clientId: cid, scope, proxyBaseUrl: cfg.proxyBaseUrl });
  setGitHubGistSyncConfig({ clientId: cid });
  return { ...device, clientId: cid };
}

export async function finishGitHubDeviceFlow({ clientId, deviceCode, intervalSec, expiresInSec } = {}) {
  const cfg = getGitHubGistSyncConfig();
  const cid = String(clientId ?? cfg.clientId ?? '').trim();
  if (!cid) throw new Error('Falta el Client ID del OAuth App.');

  const token = await pollGitHubDeviceAccessToken({
    clientId: cid,
    deviceCode,
    intervalSec,
    expiresInSec,
    proxyBaseUrl: cfg.proxyBaseUrl
  });

  setGitHubGistSyncConfig({ token: token.accessToken, clientId: cid });
  return { ...token, clientId: cid };
}

