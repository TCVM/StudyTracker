import { getCloudSyncConfig } from '../sync/cloud-sync.mjs';

function normalizeBaseUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  const withScheme = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
}

async function apiJson({ path, method = 'GET', body = null, sessionToken = '' } = {}) {
  const cfg = getCloudSyncConfig();
  const baseUrl = normalizeBaseUrl(cfg?.baseUrl);
  if (!baseUrl) return null;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
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

export async function listCloudSharedSubjects({ limit = 12 } = {}) {
  const lim = Math.max(1, Math.min(24, Number(limit) || 12));
  return apiJson({ path: `/api/shared-subjects?limit=${encodeURIComponent(String(lim))}` });
}

export async function publishCloudSharedSubject({ payload, sessionToken } = {}) {
  const token = String(sessionToken ?? '').trim();
  if (!token) throw new Error('No conectado. Inicia sesion para publicar.');
  return apiJson({
    path: '/api/shared-subjects',
    method: 'POST',
    sessionToken: token,
    body: { payload }
  });
}
