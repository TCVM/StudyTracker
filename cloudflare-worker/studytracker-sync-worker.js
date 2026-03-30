/**
 * StudyTracker Sync Backend (Cloudflare Worker)
 *
 * Features:
 * - GitHub OAuth login (server-side code exchange)
 * - Issues a signed session token (JWT-like HS256) for the SPA
 * - Stores per-user encrypted backup blobs in KV
 *
 * Bindings (Wrangler):
 * - SYNC_KV: KV namespace
 * - GITHUB_CLIENT_ID: secret/var
 * - GITHUB_CLIENT_SECRET: secret/var
 * - JWT_SECRET: secret/var (random long string)
 * - ALLOWED_ORIGINS: optional var (comma-separated). If empty, allows all origins.
 *
 * Routes:
 * - GET  /auth/github/start?redirect=<url>
 * - GET  /auth/github/callback?code=...&state=...
 * - POST /api/backup  (Authorization: Bearer <sessionToken>)
 * - GET  /api/backup  (Authorization: Bearer <sessionToken>)
 */

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

function jsonResponse(obj, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '*';
  const allowed = String(env.ALLOWED_ORIGINS || '').trim();
  if (!allowed) {
    return {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Max-Age': '86400'
    };
  }

  const allowList = allowed.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowList.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Max-Age': '86400'
    };
  }

  return {
    'Access-Control-Allow-Origin': 'null',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

function badRequest(message, request, env) {
  return jsonResponse({ ok: false, error: message }, { status: 400, headers: corsHeaders(request, env) });
}

function unauthorized(message, request, env) {
  return jsonResponse({ ok: false, error: message }, { status: 401, headers: corsHeaders(request, env) });
}

function base64UrlEncode(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecodeToBytes(input) {
  const s = String(input || '').replaceAll('-', '+').replaceAll('_', '/');
  const padded = s + '==='.slice((s.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSha256(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secret || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return new Uint8Array(sig);
}

async function signSession(env, payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  const sig = await hmacSha256(env.JWT_SECRET, data);
  const sigB64 = base64UrlEncode(sig);
  return `${data}.${sigB64}`;
}

async function verifySession(env, token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = await hmacSha256(env.JWT_SECRET, data);
  const provided = base64UrlDecodeToBytes(s);
  if (provided.length !== expected.length) return null;
  let ok = 0;
  for (let i = 0; i < provided.length; i++) ok |= provided[i] ^ expected[i];
  if (ok !== 0) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecodeToBytes(p)));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = Number(payload?.exp || 0);
  if (exp && now > exp) return null;
  return payload;
}

function randomHex(bytesLen = 16) {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesLen));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function exchangeCodeForToken({ code, env }) {
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || !json.access_token) {
    throw new Error(`No se pudo obtener access_token (${res.status}).`);
  }
  return String(json.access_token);
}

async function fetchGitHubUser({ accessToken }) {
  const res = await fetch(GITHUB_USER_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'StudyTracker-Sync-Worker'
    }
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || !json.id) {
    throw new Error(`No se pudo validar usuario (${res.status}).`);
  }
  return { id: String(json.id), login: String(json.login || '') };
}

function buildGitHubState({ redirectUrl }) {
  const payload = {
    v: 1,
    redirectUrl: String(redirectUrl || ''),
    nonce: randomHex(16),
    iat: Date.now()
  };
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
}

function parseGitHubState(state) {
  try {
    const text = new TextDecoder().decode(base64UrlDecodeToBytes(state));
    const parsed = JSON.parse(text);
    if (!parsed || parsed.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function handleAuthStart(request, env, url) {
  const redirectUrl = url.searchParams.get('redirect');
  if (!redirectUrl) return badRequest('Falta redirect.', request, env);

  const state = buildGitHubState({ redirectUrl });
  const callbackUrl = new URL('/auth/github/callback', url.origin);

  const gh = new URL(GITHUB_AUTHORIZE_URL);
  gh.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  gh.searchParams.set('redirect_uri', callbackUrl.toString());
  gh.searchParams.set('scope', 'read:user');
  gh.searchParams.set('state', state);

  return new Response(null, { status: 302, headers: { Location: gh.toString() } });
}

async function handleAuthCallback(request, env, url) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return badRequest('Falta code/state.', request, env);

  const parsedState = parseGitHubState(state);
  if (!parsedState?.redirectUrl) return badRequest('State inválido.', request, env);

  let accessToken;
  try {
    accessToken = await exchangeCodeForToken({ code, env });
  } catch (e) {
    return badRequest(String(e?.message || 'OAuth exchange falló.'), request, env);
  }

  let user;
  try {
    user = await fetchGitHubUser({ accessToken });
  } catch (e) {
    return badRequest(String(e?.message || 'No se pudo validar usuario.'), request, env);
  }

  const now = Math.floor(Date.now() / 1000);
  const session = await signSession(env, {
    v: 1,
    sub: user.id,
    login: user.login,
    iat: now,
    exp: now + 60 * 60 * 24 * 30
  });

  const dest = new URL(String(parsedState.redirectUrl));
  dest.searchParams.set('sync_token', session);

  return new Response(null, { status: 302, headers: { Location: dest.toString() } });
}

async function requireUser(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1];
  return verifySession(env, token);
}

async function handleBackupGet(request, env) {
  const user = await requireUser(request, env);
  if (!user?.sub) return unauthorized('No autorizado.', request, env);
  const key = `u:${user.sub}:backup`;
  const raw = await env.SYNC_KV.get(key, 'json');
  if (!raw) {
    return jsonResponse({ ok: true, hasBackup: false }, { headers: corsHeaders(request, env) });
  }
  return jsonResponse({ ok: true, hasBackup: true, ...raw }, { headers: corsHeaders(request, env) });
}

async function handleBackupPost(request, env) {
  const user = await requireUser(request, env);
  if (!user?.sub) return unauthorized('No autorizado.', request, env);

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest('JSON inválido.', request, env);
  }

  const encryptedText = String(body?.encryptedText ?? '').trim();
  if (!encryptedText) return badRequest('Falta encryptedText.', request, env);

  const record = {
    encryptedText,
    updatedAt: new Date().toISOString(),
    schema: 'study-tracker-cloud-backup',
    v: 1
  };

  const key = `u:${user.sub}:backup`;
  await env.SYNC_KV.put(key, JSON.stringify(record));

  return jsonResponse({ ok: true, updatedAt: record.updatedAt }, { headers: corsHeaders(request, env) });
}


async function handleBackupsList(request, env, url) {
  const user = await requireUser(request, env);
  if (!user?.sub) return unauthorized('No autorizado.', request, env);

  const lim = Math.max(1, Math.min(25, parseInt(url.searchParams.get('limit') || '10', 10) || 10));
  const indexKey = `u:${user.sub}:backups`;
  const index = (await env.SYNC_KV.get(indexKey, 'json')) || [];
  const items = Array.isArray(index) ? index.slice(0, lim) : [];
  return jsonResponse({ ok: true, items }, { headers: corsHeaders(request, env) });
}

async function handleBackupById(request, env, backupId) {
  const user = await requireUser(request, env);
  if (!user?.sub) return unauthorized('No autorizado.', request, env);

  const id = String(backupId || '').trim();
  if (!id) return badRequest('Falta id.', request, env);

  const raw = await env.SYNC_KV.get(`u:${user.sub}:backup:${id}`, 'json');
  if (!raw) return badRequest('Backup no encontrado.', request, env);

  return jsonResponse({ ok: true, id, ...raw }, { headers: corsHeaders(request, env) });
}

async function handleMe(request, env) {
  const user = await requireUser(request, env);
  if (!user?.sub) return unauthorized('No autorizado.', request, env);
  return jsonResponse({ ok: true, user: { id: String(user.sub), login: String(user.login || '') } }, { headers: corsHeaders(request, env) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname === '/auth/github/start' && request.method === 'GET') {
      return handleAuthStart(request, env, url);
    }

    if (url.pathname === '/auth/github/callback' && request.method === 'GET') {
      return handleAuthCallback(request, env, url);
    }

    if (url.pathname === '/api/backup' && request.method === 'GET') {
      return handleBackupGet(request, env);
    }

    if (url.pathname === '/api/backup' && request.method === 'POST') {
      return handleBackupPost(request, env);
    }

    return jsonResponse({ ok: false, error: 'Not Found' }, { status: 404, headers: corsHeaders(request, env) });
  }
};

