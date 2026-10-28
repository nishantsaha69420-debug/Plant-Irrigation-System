import crypto from 'crypto';

const SECRET_KEY = process.env.SESSION_SECRET || 'rootwise_botanical_secure_session_secret_default_key_123';

export interface SessionPayload {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
}

/**
 * Sign a payload using HMAC SHA-256 for tamper-proof session cookies
 */
export function createSignedSessionToken(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const dataBase64 = Buffer.from(data).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataBase64)
    .digest('base64url');
  return `${dataBase64}.${signature}`;
}

/**
 * Verify HMAC SHA-256 signature and return payload, or null if tampered/invalid
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [dataBase64, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(dataBase64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const jsonStr = Buffer.from(dataBase64, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr) as SessionPayload;

    // Check expiration (e.g. 14 days)
    const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.createdAt > MAX_AGE_MS) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
