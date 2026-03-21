import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_PREFIX = "scrypt";
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function ensurePasswordInput(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Password is required.");
  }

  return value;
}

function encodeBase64Url(input: Buffer): string {
  return input.toString("base64url");
}

function decodeBase64Url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function deriveKey(password: string, salt: Buffer, keyLength: number, N: number, r: number, p: number): Buffer {
  return scryptSync(password, salt, keyLength, {
    N,
    r,
    p,
  });
}

export async function hashPassword(plainPassword: string): Promise<string> {
  const password = ensurePasswordInput(plainPassword);
  const salt = randomBytes(SALT_LENGTH);
  const derived = deriveKey(password, salt, KEY_LENGTH, SCRYPT_N, SCRYPT_R, SCRYPT_P);

  return [
    SCRYPT_PREFIX,
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    encodeBase64Url(salt),
    encodeBase64Url(derived),
  ].join("$");
}

export async function verifyPassword(plainPassword: string, storedHash: string): Promise<boolean> {
  const password = ensurePasswordInput(plainPassword);
  const parts = storedHash.split("$");

  if (parts.length !== 6) {
    return false;
  }

  const [prefix, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts;
  if (prefix !== SCRYPT_PREFIX) {
    return false;
  }

  const N = Number.parseInt(nRaw, 10);
  const r = Number.parseInt(rRaw, 10);
  const p = Number.parseInt(pRaw, 10);

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }

  try {
    const salt = decodeBase64Url(saltRaw);
    const expected = decodeBase64Url(hashRaw);
    const derived = deriveKey(password, salt, expected.length, N, r, p);

    if (derived.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
