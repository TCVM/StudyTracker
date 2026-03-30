const DEVICE_CODE_ENDPOINT = 'https://github.com/login/device/code';
const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postFormJson(url, form) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(form)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub OAuth error ${res.status}: ${text || res.statusText}`);
  }

  return res.json();
}

export async function requestGitHubDeviceCode({ clientId, scope = 'gist' }) {
  const cid = String(clientId ?? '').trim();
  if (!cid) throw new Error('Falta el Client ID del OAuth App.');

  const json = await postFormJson(DEVICE_CODE_ENDPOINT, {
    client_id: cid,
    scope: String(scope ?? 'gist')
  });

  const deviceCode = String(json?.device_code ?? '').trim();
  const userCode = String(json?.user_code ?? '').trim();
  const verificationUri = String(json?.verification_uri ?? '').trim();
  const intervalSec = Number(json?.interval ?? 5) || 5;
  const expiresInSec = Number(json?.expires_in ?? 900) || 900;

  if (!deviceCode || !userCode || !verificationUri) {
    throw new Error('Respuesta inválida del device flow (faltan campos).');
  }

  return {
    deviceCode,
    userCode,
    verificationUri,
    intervalSec,
    expiresInSec
  };
}

export async function pollGitHubDeviceAccessToken({
  clientId,
  deviceCode,
  intervalSec = 5,
  expiresInSec = 900
}) {
  const cid = String(clientId ?? '').trim();
  const dcode = String(deviceCode ?? '').trim();
  if (!cid) throw new Error('Falta el Client ID del OAuth App.');
  if (!dcode) throw new Error('Falta el device_code.');

  const deadlineMs = Date.now() + (Number(expiresInSec) || 900) * 1000;
  let intervalMs = (Number(intervalSec) || 5) * 1000;

  while (Date.now() < deadlineMs) {
    await sleep(intervalMs);

    const json = await postFormJson(TOKEN_ENDPOINT, {
      client_id: cid,
      device_code: dcode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    });

    const accessToken = String(json?.access_token ?? '').trim();
    if (accessToken) {
      return { accessToken, scope: String(json?.scope ?? ''), tokenType: String(json?.token_type ?? 'bearer') };
    }

    const err = String(json?.error ?? '').trim();
    if (!err) {
      throw new Error('Respuesta inválida del token endpoint.');
    }

    if (err === 'authorization_pending') {
      continue;
    }

    if (err === 'slow_down') {
      intervalMs += 5000;
      continue;
    }

    if (err === 'expired_token') {
      throw new Error('El código expiró. Reintentá conectar.');
    }

    if (err === 'access_denied') {
      throw new Error('Acceso denegado por el usuario.');
    }

    throw new Error(`Error de autorización: ${err}`);
  }

  throw new Error('Tiempo agotado esperando autorización.');
}

