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

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readUsers(): UserRecord[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as UserRecord[];
  } catch {
    return [];
  }
}

function writeUsers(users: UserRecord[]) {
  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
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

export function findUserByEmail(email: string): UserRecord | null {
  const users = readUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function createUserRecord(name: string, email: string, password: string): UserRecord {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
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

  users.push(newRecord);
  writeUsers(users);
  return newRecord;
}
