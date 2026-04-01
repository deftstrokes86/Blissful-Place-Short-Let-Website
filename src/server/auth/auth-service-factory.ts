import { AuthService } from "./auth-service";
import { prismaAuthRepository } from "./prisma-auth-repository";

let sharedAuthService: AuthService | null = null;

export function createAuthService(): AuthService {
  return new AuthService({ repository: prismaAuthRepository });
}

export function getSharedAuthService(): AuthService {
  if (!sharedAuthService) {
    sharedAuthService = createAuthService();
  }

  return sharedAuthService;
}

export function resetSharedAuthServiceForTests(): void {
  sharedAuthService = null;
}
