export type NotificationRuntimeEnvironment = "development" | "test" | "production";

export interface NotificationSenderConfig {
  name: string;
  email: string;
}

export interface NotificationConfig {
  environment: NotificationRuntimeEnvironment;
  sender: NotificationSenderConfig;
  staffInternalRecipient: string;
  staffRecipientEmails: readonly string[];
  emailDeliveryEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_SENDER_NAME = "Blissful Place Reservations";
export const DEFAULT_NOTIFICATION_SENDER_EMAIL = "no-reply@localhost.invalid";
export const DEFAULT_NOTIFICATION_SENDER: NotificationSenderConfig = {
  name: DEFAULT_NOTIFICATION_SENDER_NAME,
  email: DEFAULT_NOTIFICATION_SENDER_EMAIL,
};
export const DEFAULT_NOTIFICATION_STAFF_INTERNAL_RECIPIENT = "ops:bookings";
export const DEFAULT_NOTIFICATION_STAFF_RECIPIENT_EMAILS = ["ops@localhost.invalid"] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string): string | null {
  const value = env[key];

  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBoolean(value: string | null, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`Invalid boolean value '${value}'. Expected 'true' or 'false'.`);
}

function normalizeEnvironment(value: string | null): NotificationRuntimeEnvironment {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

function assertValidEmailAddress(value: string, label: string): void {
  if (!EMAIL_PATTERN.test(value)) {
    throw new Error(`${label} must be a valid email address.`);
  }
}

function resolveSender(env: NodeJS.ProcessEnv): NotificationSenderConfig {
  const name = readOptionalEnv(env, "NOTIFICATION_SENDER_NAME") ?? DEFAULT_NOTIFICATION_SENDER.name;
  const email = readOptionalEnv(env, "NOTIFICATION_SENDER_EMAIL") ?? DEFAULT_NOTIFICATION_SENDER.email;

  if (name.length === 0) {
    throw new Error("NOTIFICATION_SENDER_NAME cannot be empty.");
  }

  assertValidEmailAddress(email, "NOTIFICATION_SENDER_EMAIL");

  return {
    name,
    email,
  };
}

function resolveStaffInternalRecipient(env: NodeJS.ProcessEnv): string {
  return readOptionalEnv(env, "NOTIFICATION_STAFF_INTERNAL_RECIPIENT") ?? DEFAULT_NOTIFICATION_STAFF_INTERNAL_RECIPIENT;
}

function resolveStaffRecipientEmails(env: NodeJS.ProcessEnv): readonly string[] {
  const raw = readOptionalEnv(env, "NOTIFICATION_STAFF_RECIPIENT_EMAILS");

  const values = raw
    ? raw
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [...DEFAULT_NOTIFICATION_STAFF_RECIPIENT_EMAILS];

  if (values.length === 0) {
    throw new Error("NOTIFICATION_STAFF_RECIPIENT_EMAILS must include at least one email address.");
  }

  for (const email of values) {
    assertValidEmailAddress(email, "NOTIFICATION_STAFF_RECIPIENT_EMAILS");
  }

  return values;
}

function resolveEmailDeliveryEnabled(env: NodeJS.ProcessEnv, environment: NotificationRuntimeEnvironment): boolean {
  const requested = parseBoolean(readOptionalEnv(env, "NOTIFICATION_EMAIL_ENABLED"), false);
  if (!requested) {
    return false;
  }

  if (environment === "production") {
    return true;
  }

  return parseBoolean(readOptionalEnv(env, "NOTIFICATION_ALLOW_NON_PROD_EMAIL"), false);
}

export function getNotificationConfig(env: NodeJS.ProcessEnv = process.env): NotificationConfig {
  const environment = normalizeEnvironment(readOptionalEnv(env, "NODE_ENV"));

  return {
    environment,
    sender: resolveSender(env),
    staffInternalRecipient: resolveStaffInternalRecipient(env),
    staffRecipientEmails: resolveStaffRecipientEmails(env),
    emailDeliveryEnabled: resolveEmailDeliveryEnabled(env, environment),
  };
}
