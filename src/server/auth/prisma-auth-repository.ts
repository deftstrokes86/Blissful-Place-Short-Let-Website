import { prisma } from "../db/prisma";
import type { AuthRepository } from "./auth-repository";
import type { AuthSessionRecord, AuthUserRecord } from "../../types/auth";

function mapUser(row: {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AuthUserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as AuthUserRecord["role"],
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapSession(row: {
  id: string;
  userId: string;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): AuthSessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    sessionToken: row.sessionToken,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaAuthRepository implements AuthRepository {
  async countUsers(): Promise<number> {
    return prisma.authUser.count();
  }

  async createUser(input: Omit<AuthUserRecord, "id" | "createdAt" | "updatedAt">): Promise<AuthUserRecord> {
    const created = await prisma.authUser.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        isActive: input.isActive,
      },
    });

    return mapUser(created);
  }

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const found = await prisma.authUser.findUnique({ where: { email } });
    return found ? mapUser(found) : null;
  }

  async findUserById(id: string): Promise<AuthUserRecord | null> {
    const found = await prisma.authUser.findUnique({ where: { id } });
    return found ? mapUser(found) : null;
  }

  async createSession(
    input: Omit<AuthSessionRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<AuthSessionRecord> {
    // Delete any existing session with the same token (upsert by token).
    await prisma.authSession.deleteMany({ where: { sessionToken: input.sessionToken } });

    const created = await prisma.authSession.create({
      data: {
        userId: input.userId,
        sessionToken: input.sessionToken,
        expiresAt: new Date(input.expiresAt),
      },
    });

    return mapSession(created);
  }

  async findSessionByToken(sessionToken: string): Promise<AuthSessionRecord | null> {
    const found = await prisma.authSession.findUnique({ where: { sessionToken } });
    return found ? mapSession(found) : null;
  }

  async deleteSessionByToken(sessionToken: string): Promise<void> {
    await prisma.authSession.deleteMany({ where: { sessionToken } });
  }
}

export const prismaAuthRepository = new PrismaAuthRepository();
