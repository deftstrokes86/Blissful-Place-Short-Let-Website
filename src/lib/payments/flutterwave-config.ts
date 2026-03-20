
export interface FlutterwaveServerConfig {
  secretKey: string;
  publicKey: string | null;
  webhookSecretHash: string | null;
  apiBaseUrl: string;
  redirectUrl: string;
  siteUrl: string | null;
}

const DEFAULT_FLUTTERWAVE_API_BASE_URL = "https://api.flutterwave.com/v3";
const DEFAULT_LOCAL_REDIRECT_URL = "http://localhost:3000/api/payments/website/callback";
const WEBSITE_CALLBACK_PATH = "/api/payments/website/callback";

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string): string | null {
  const value = env[key];

  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readRequiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = readOptionalEnv(env, key);

  if (!value) {
    throw new Error(`${key} is required for Flutterwave integration.`);
  }

  return value;
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveRedirectUrl(env: NodeJS.ProcessEnv, siteUrl: string | null): string {
  const explicitRedirectUrl = readOptionalEnv(env, "FLW_REDIRECT_URL");
  if (explicitRedirectUrl) {
    return explicitRedirectUrl;
  }

  if (siteUrl) {
    return `${withoutTrailingSlash(siteUrl)}${WEBSITE_CALLBACK_PATH}`;
  }

  return DEFAULT_LOCAL_REDIRECT_URL;
}

export function getFlutterwaveConfig(env: NodeJS.ProcessEnv = process.env): FlutterwaveServerConfig {
  const siteUrl = readOptionalEnv(env, "SITE_URL");

  return {
    secretKey: readRequiredEnv(env, "FLW_SECRET_KEY"),
    publicKey: readOptionalEnv(env, "FLW_PUBLIC_KEY"),
    webhookSecretHash: readOptionalEnv(env, "FLW_WEBHOOK_SECRET_HASH"),
    apiBaseUrl: withoutTrailingSlash(
      readOptionalEnv(env, "FLW_API_BASE_URL") ?? DEFAULT_FLUTTERWAVE_API_BASE_URL
    ),
    redirectUrl: resolveRedirectUrl(env, siteUrl),
    siteUrl,
  };
}

export function getRequiredFlutterwaveWebhookSecretHash(env: NodeJS.ProcessEnv = process.env): string {
  const secretHash = getFlutterwaveConfig(env).webhookSecretHash;

  if (!secretHash) {
    throw new Error("FLW_WEBHOOK_SECRET_HASH is required for Flutterwave webhook validation.");
  }

  return secretHash;
}

