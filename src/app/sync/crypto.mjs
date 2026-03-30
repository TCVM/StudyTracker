const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64(bytes) {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(String(b64 || ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKeyFromPassphrase(passphrase, salt, iterations) {
  const passBytes = textEncoder.encode(String(passphrase ?? ''));
  const keyMaterial = await crypto.subtle.importKey('raw', passBytes, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptStringWithPassphrase(plainText, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 210000;
  const key = await deriveKeyFromPassphrase(passphrase, salt, iterations);

  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(String(plainText ?? ''))
  );

  const payload = {
    schema: 'study-tracker-sync',
    v: 1,
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations,
      salt: bytesToBase64(salt)
    },
    cipher: {
      name: 'AES-GCM',
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(cipherBuf))
    }
  };

  return JSON.stringify(payload);
}

export async function decryptStringWithPassphrase(encryptedJsonText, passphrase) {
  let parsed;
  try {
    parsed = JSON.parse(String(encryptedJsonText ?? '').trim());
  } catch {
    throw new Error('Formato inválido (no es JSON).');
  }

  if (!parsed || parsed.schema !== 'study-tracker-sync' || parsed.v !== 1) {
    throw new Error('Formato inválido (schema/version).');
  }

  const iterations = Number(parsed?.kdf?.iterations) || 0;
  const saltB64 = parsed?.kdf?.salt;
  const ivB64 = parsed?.cipher?.iv;
  const dataB64 = parsed?.cipher?.data;

  if (!iterations || !saltB64 || !ivB64 || !dataB64) {
    throw new Error('Formato inválido (faltan campos).');
  }

  const salt = base64ToBytes(saltB64);
  const iv = base64ToBytes(ivB64);
  const data = base64ToBytes(dataB64);

  const key = await deriveKeyFromPassphrase(passphrase, salt, iterations);

  let plainBuf;
  try {
    plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  } catch {
    throw new Error('No se pudo descifrar (contraseña incorrecta o archivo corrupto).');
  }

  return textDecoder.decode(plainBuf);
}


