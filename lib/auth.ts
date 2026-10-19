export const AUTH_COOKIE_NAME = 'naturalista_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias en segundos

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) {
    return secret;
  }
  const user = process.env.AUTH_USER || 'admin';
  const pass = process.env.AUTH_PASSWORD || 'naturalista-secret-seed';
  return `secret-seed:${user}:${pass}`;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const secretBytes = enc.encode(getAuthSecret());
  return crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Comparacion en tiempo constante para mitigar timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Valida credenciales contra las variables de entorno AUTH_USER y AUTH_PASSWORD
 */
export function verifyCredentials(user: string, pass: string): boolean {
  const expectedUser = process.env.AUTH_USER;
  const expectedPass = process.env.AUTH_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return false;
  }

  const userMatch = timingSafeEqual(user.trim(), expectedUser.trim());
  const passMatch = timingSafeEqual(pass, expectedPass);

  return userMatch && passMatch;
}

/**
 * Genera un token de sesion firmado criptograficamente con HMAC SHA-256
 */
export async function createSessionToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const key = await getHmacKey();
  const enc = new TextEncoder();
  const data = enc.encode(`naturalista-session:${timestamp}`);

  const signature = await crypto.subtle.sign('HMAC', key, data);
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${timestamp}.${sigHex}`;
}

/**
 * Verifica la firma criptografica y la vigencia del token de sesion
 */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [timestampStr, sigHex] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return false;
  }

  // Comprobar que no haya expirado (30 dias)
  const now = Date.now();
  if (now - timestamp > SESSION_MAX_AGE * 1000 || timestamp > now + 60000) {
    return false;
  }

  const key = await getHmacKey();
  const enc = new TextEncoder();
  const data = enc.encode(`naturalista-session:${timestampStr}`);

  const sigBytes = new Uint8Array(
    (sigHex.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16))
  );

  return crypto.subtle.verify('HMAC', key, sigBytes, data);
}
