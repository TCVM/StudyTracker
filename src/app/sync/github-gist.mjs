const API_BASE = 'https://api.github.com';

function authHeaders(token) {
  const t = String(token ?? '').trim();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}

async function apiJson(path, { token, method = 'GET', body = null } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json();
}

export async function createEncryptedBackupGist({ token, filename, content }) {
  const payload = {
    description: 'StudyTracker Sync Backup (encrypted)',
    public: false,
    files: {
      [filename]: { content }
    }
  };

  const json = await apiJson('/gists', { token, method: 'POST', body: payload });
  return { gistId: json?.id, url: json?.html_url };
}

export async function updateEncryptedBackupGist({ token, gistId, filename, content }) {
  const payload = {
    files: {
      [filename]: { content }
    }
  };

  const json = await apiJson(`/gists/${encodeURIComponent(String(gistId))}`, {
    token,
    method: 'PATCH',
    body: payload
  });

  return { gistId: json?.id, url: json?.html_url };
}

export async function fetchEncryptedBackupFromGist({ token, gistId, filename }) {
  const json = await apiJson(`/gists/${encodeURIComponent(String(gistId))}`, { token, method: 'GET' });
  const file = json?.files?.[filename];
  if (!file) {
    throw new Error(`No se encontró el archivo "${filename}" en el Gist.`);
  }

  if (!file.truncated && typeof file.content === 'string') {
    return file.content;
  }

  const rawUrl = String(file.raw_url || '').trim();
  if (!rawUrl) {
    throw new Error('No se pudo obtener raw_url del archivo en el Gist.');
  }

  const res = await fetch(rawUrl, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el contenido raw (${res.status}).`);
  }
  return res.text();
}
