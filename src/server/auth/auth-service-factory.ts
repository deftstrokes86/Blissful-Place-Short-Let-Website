import { AuthService } from "./auth-service";
import { fileAuthRepository } from "./file-auth-repository";

let sharedAuthService: AuthService | null = null;

export function createAuthService(): AuthService {
  return new AuthService({ repository: fileAuthRepository });
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
