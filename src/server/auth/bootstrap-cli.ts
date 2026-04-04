import { AuthService } from "./auth-service";
import { prismaAuthRepository } from "./prisma-auth-repository";
import {
  bootstrapInitialAuthUser,
  parseBootstrapAuthEnv,
  type BootstrapAuthUserStore,
} from "./bootstrap-auth-user";

interface BootstrapCliResult {
  created: boolean;
  user: {
    id: string;
    email: string;
    role: "admin" | "staff";
  };
}

function createBootstrapUserStore(): BootstrapAuthUserStore {
  return {
    countUsers: () => prismaAuthRepository.countUsers(),
    findUserByEmail: (email: string) => prismaAuthRepository.findUserByEmail(email),
  };
}

export async function runAuthBootstrapFromEnv(env: NodeJS.ProcessEnv): Promise<BootstrapCliResult> {
  const input = parseBootstrapAuthEnv({
    AUTH_BOOTSTRAP_ENABLED: env.AUTH_BOOTSTRAP_ENABLED,
    AUTH_BOOTSTRAP_EMAIL: env.AUTH_BOOTSTRAP_EMAIL,
    AUTH_BOOTSTRAP_PASSWORD: env.AUTH_BOOTSTRAP_PASSWORD,
    AUTH_BOOTSTRAP_ROLE: env.AUTH_BOOTSTRAP_ROLE,
  });

  const authService = new AuthService({ repository: prismaAuthRepository });
  const result = await bootstrapInitialAuthUser(input, {
    authService,
    userStore: createBootstrapUserStore(),
  });

  return {
    created: result.created,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    },
  };
}

async function runCli(): Promise<void> {
  const result = await runAuthBootstrapFromEnv(process.env);

  if (result.created) {
    console.log(`Auth bootstrap created ${result.user.role} user: ${result.user.email}`);
  } else {
    console.log(`Auth bootstrap skipped; user already exists: ${result.user.email}`);
  }
}

if (require.main === module) {
  void runCli().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Auth bootstrap failed.";
    console.error(message);
    process.exitCode = 1;
  });
}
