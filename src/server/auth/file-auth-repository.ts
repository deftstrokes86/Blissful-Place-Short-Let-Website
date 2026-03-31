import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { AuthRepository } from "./auth-repository";
import type { AuthSessionRecord, AuthUserRecord } from "../../types/auth";
import { nowIso } from "../db/db-utils";

interface AuthDatabaseState {
  users: AuthUserRecord[];
  sessions: AuthSessionRecord[];
}

const AUTH_DATA_FILE_PATH = join(process.cwd(), ".data", "auth-db.json");

let authDatabaseQueue: Promise<unknown> = Promise.resolve();

function createEmptyAuthDatabaseState(): AuthDatabaseState {
  return {
    users: [],
    sessions: [],
  };
}

function cloneUser(user: AuthUserRecord): AuthUserRecord {
  return { ...user };
}

function cloneSession(session: AuthSessionRecord): AuthSessionRecord {
  return { ...session };
}

async function ensureAuthDataFile(): Promise<void> {
  if (existsSync(AUTH_DATA_FILE_PATH)) {
    return;
  }

  await mkdir(dirname(AUTH_DATA_FILE_PATH), { recursive: true });
  await writeFile(AUTH_DATA_FILE_PATH, JSON.stringify(createEmptyAuthDatabaseState(), null, 2), "utf8");
}

async function readAuthDatabaseState(): Promise<AuthDatabaseState> {
  await ensureAuthDataFile();
  const raw = await readFile(AUTH_DATA_FILE_PATH, "utf8");

  let parsed: Partial<AuthDatabaseState>;
  try {
    parsed = JSON.parse(raw) as Partial<AuthDatabaseState>;
  } catch (error) {
    throw new Error(
      `Auth database file is corrupt or unreadable at ${AUTH_DATA_FILE_PATH}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    users: (parsed.users ?? []).map(cloneUser),
    sessions: (parsed.sessions ?? []).map(cloneSession),
  };
}

async function writeAuthDatabaseState(state: AuthDatabaseState): Promise<void> {
  await writeFile(AUTH_DATA_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
}

async function readAuthDatabase(): Promise<AuthDatabaseState> {
  return readAuthDatabaseState();
}

async function withAuthDatabase<T>(operation: (state: AuthDatabaseState) => Promise<T> | T): Promise<T> {
  const queuedOperation = authDatabaseQueue.then(async () => {
    const state = await readAuthDatabaseState();
    const result = await operation(state);
    await writeAuthDatabaseState(state);
    return result;
  });

  authDatabaseQueue = queuedOperation.then(
    () => undefined,
    () => undefined
  );

  return queuedOperation;
}

function createAuthId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export class FileAuthRepository implements AuthRepository {
  async countUsers(): Promise<number> {
    const db = await readAuthDatabase();
    return db.users.length;
  }

  async createUser(input: Omit<AuthUserRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthUserRecord> {
    return withAuthDatabase(async (db) => {
      if (db.users.some((user) => user.email === input.email)) {
        throw new Error("User email already exists.");
      }

      const now = nowIso();
      const created: AuthUserRecord = {
        ...input,
        id: createAuthId("auth_user"),
        createdAt: now,
        updatedAt: now,
      };

      db.users.push(created);
      return cloneUser(created);
    });
  }

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const db = await readAuthDatabase();
    const found = db.users.find((user) => user.email === email);
    return found ? cloneUser(found) : null;
  }

  async findUserById(id: string): Promise<AuthUserRecord | null> {
    const db = await readAuthDatabase();
    const found = db.users.find((user) => user.id === id);
    return found ? cloneUser(found) : null;
  }

  async createSession(input: Omit<AuthSessionRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthSessionRecord> {
    return withAuthDatabase(async (db) => {
      const now = nowIso();
      const created: AuthSessionRecord = {
        ...input,
        id: createAuthId("auth_session"),
        createdAt: now,
        updatedAt: now,
      };

      db.sessions = db.sessions.filter((session) => session.sessionToken !== input.sessionToken);
      db.sessions.push(created);

      return cloneSession(created);
    });
  }

  async findSessionByToken(sessionToken: string): Promise<AuthSessionRecord | null> {
    const db = await readAuthDatabase();
    const found = db.sessions.find((session) => session.sessionToken === sessionToken);
    return found ? cloneSession(found) : null;
  }

  async deleteSessionByToken(sessionToken: string): Promise<void> {
    await withAuthDatabase(async (db) => {
      db.sessions = db.sessions.filter((session) => session.sessionToken !== sessionToken);
    });
  }
}

export const fileAuthRepository = new FileAuthRepository();


