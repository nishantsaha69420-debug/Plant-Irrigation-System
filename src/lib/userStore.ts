import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: number;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const FIREBASE_DB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://auto-irrigation-system-8225b-default-rtdb.asia-southeast1.firebasedatabase.app';

function getDbBaseUrl(): string {
  return FIREBASE_DB_URL.replace(/\/+$/, '');
}

export function emailToKey(email: string): string {
  return Buffer.from(email.trim().toLowerCase()).toString('hex');
}

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch {
    // In serverless / read-only filesystems (e.g. Vercel), writing to process.cwd() is prohibited
    // Silently continue since cloud database is our primary store
  }
}

function readLocalUsers(): UserRecord[] {
  try {
    ensureDataFile();
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as UserRecord[];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: UserRecord[]) {
  try {
    ensureDataFile();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch {
    // Ignored in read-only filesystems
  }
}

/**
 * Hash password securely using Node native scrypt with random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify password against stored hash using constant-time comparison
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Look up user by email from Firebase Realtime Database with local file fallback
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const key = emailToKey(normalized);

  // 1. Try Firebase Cloud RTDB
  try {
    const res = await fetch(`${getDbBaseUrl()}/users/${key}.json`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const user = (await res.json()) as UserRecord | null;
      if (user && user.email) {
        return user;
      }
    }
  } catch (err) {
    console.warn('Firebase RTDB query error, falling back to local storage:', err);
  }

  // 2. Fallback to local storage (for offline or local development)
  const localUsers = readLocalUsers();
  return localUsers.find((u) => u.email.toLowerCase() === normalized) || null;
}

/**
 * Create a new user record in Firebase Realtime Database and local storage
 */
export async function createUserRecord(
  name: string,
  email: string,
  password: string
): Promise<UserRecord> {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const cleanName = name.trim() || normalizedEmail.split('@')[0] || 'Grower';
  const newRecord: UserRecord = {
    uid: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    email: normalizedEmail,
    displayName: cleanName,
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
  };

  // 1. Store in Firebase Cloud RTDB
  const key = emailToKey(normalizedEmail);
  try {
    const res = await fetch(`${getDbBaseUrl()}/users/${key}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    });
    if (!res.ok) {
      console.warn(`Firebase RTDB write returned status ${res.status}`);
    }
  } catch (err) {
    console.warn('Failed to persist user in Firebase RTDB, saving locally:', err);
  }

  // 2. Also cache in local file if available
  const localUsers = readLocalUsers();
  localUsers.push(newRecord);
  writeLocalUsers(localUsers);

  return newRecord;
}
