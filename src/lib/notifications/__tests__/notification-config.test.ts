import assert from "node:assert/strict";

import { getNotificationConfig } from "../notification-config";

async function testSafeDevelopmentDefaults(): Promise<void> {
  const config = getNotificationConfig({
    NODE_ENV: "development",
  });

  assert.equal(config.environment, "development");
  assert.equal(config.sender.name, "Blissful Place Reservations");
  assert.equal(config.sender.email, "no-reply@localhost.invalid");
  assert.equal(config.staffInternalRecipient, "ops:bookings");
  assert.deepEqual(config.staffRecipientEmails, ["ops@localhost.invalid"]);
  assert.equal(config.emailDeliveryEnabled, false);
}

async function testProductionEmailEnabledWhenRequested(): Promise<void> {
  const config = getNotificationConfig({
    NODE_ENV: "production",
    NOTIFICATION_EMAIL_ENABLED: "true",
    NOTIFICATION_SENDER_NAME: "Reservations Team",
    NOTIFICATION_SENDER_EMAIL: "no-reply@example.test",
    NOTIFICATION_STAFF_INTERNAL_RECIPIENT: "ops:notifications",
    NOTIFICATION_STAFF_RECIPIENT_EMAILS: "ops1@example.test, ops2@example.test",
  });

  assert.equal(config.environment, "production");
  assert.equal(config.emailDeliveryEnabled, true);
  assert.equal(config.sender.name, "Reservations Team");
  assert.equal(config.sender.email, "no-reply@example.test");
  assert.equal(config.staffInternalRecipient, "ops:notifications");
  assert.deepEqual(config.staffRecipientEmails, ["ops1@example.test", "ops2@example.test"]);
}

async function testNonProductionEmailRequiresExplicitAllowFlag(): Promise<void> {
  const disabled = getNotificationConfig({
    NODE_ENV: "development",
    NOTIFICATION_EMAIL_ENABLED: "true",
  });

  assert.equal(disabled.emailDeliveryEnabled, false);

  const enabled = getNotificationConfig({
    NODE_ENV: "test",
    NOTIFICATION_EMAIL_ENABLED: "true",
    NOTIFICATION_ALLOW_NON_PROD_EMAIL: "true",
  });

  assert.equal(enabled.emailDeliveryEnabled, true);
}

async function testInvalidEmailConfigurationRejected(): Promise<void> {
  assert.throws(
    () =>
      getNotificationConfig({
        NODE_ENV: "production",
        NOTIFICATION_EMAIL_ENABLED: "true",
        NOTIFICATION_SENDER_EMAIL: "invalid-email",
      }),
    /valid email/
  );

  assert.throws(
    () =>
      getNotificationConfig({
        NODE_ENV: "test",
        NOTIFICATION_STAFF_RECIPIENT_EMAILS: "ops1@example.test, not-an-email",
      }),
    /valid email/
  );
}

async function run(): Promise<void> {
  await testSafeDevelopmentDefaults();
  await testProductionEmailEnabledWhenRequested();
  await testNonProductionEmailRequiresExplicitAllowFlag();
  await testInvalidEmailConfigurationRejected();

  console.log("notification-config: ok");
}

void run();
