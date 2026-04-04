import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function run() {
  const legacyDraftRoute = read("src/app/(site)/api/reservations/draft/route.ts");
  const legacyDraftTokenRoute = read("src/app/(site)/api/reservations/draft/[token]/route.ts");
  const legacyBranchRoute = read("src/app/(site)/api/reservations/branch-request/route.ts");
  const legacyCancelRoute = read("src/app/(site)/api/reservations/cancel/route.ts");

  for (const routeSource of [legacyDraftRoute, legacyDraftTokenRoute, legacyBranchRoute, legacyCancelRoute]) {
    assert.match(routeSource, /getSharedLegacyGuestReservationService/);
    assert.doesNotMatch(routeSource, /reservationDomainService/);
  }

  const legacyFactory = read("src/server/booking/legacy-guest-reservation-service-factory.ts");
  assert.match(legacyFactory, /prismaWebsitePaymentIdempotencyGateway/);
  assert.match(legacyFactory, /getSharedReservationService/);
  assert.match(legacyFactory, /getSharedAvailabilityService/);

  const adminInventoryService = read("src/server/inventory/admin-inventory-service.ts");
  assert.match(adminInventoryService, /import \{ prisma \} from "\.\.\/db\/prisma"/);
  assert.doesNotMatch(adminInventoryService, /readBookingDatabase/);

  const authBootstrapCli = read("src/server/auth/bootstrap-cli.ts");
  assert.match(authBootstrapCli, /prismaAuthRepository/);
  assert.doesNotMatch(authBootstrapCli, /fileAuthRepository/);

  const transferHoldJob = read("src/server/jobs/expire-transfer-holds.ts");
  assert.match(transferHoldJob, /prismaReservationRepository/);
  assert.doesNotMatch(transferHoldJob, /fileReservationRepository/);

  const prismaFactoryFiles = [
    "src/server/booking/operations-service-factory.ts",
    "src/server/inventory/admin-inventory-service-factory.ts",
    "src/server/inventory/inventory-item-service-factory.ts",
    "src/server/inventory/inventory-template-operations-service-factory.ts",
    "src/server/inventory/stock-movement-service-factory.ts",
    "src/server/inventory/worker-task-service-factory.ts",
    "src/server/inventory/flat-inventory-reconciliation-service-factory.ts",
    "src/server/tour/tour-slot-service-factory.ts",
  ];

  for (const relativePath of prismaFactoryFiles) {
    const source = read(relativePath);
    assert.match(source, /database-identifiers/);
    assert.doesNotMatch(source, /db\/file-database/);
  }

  const runtimeBoundaryDoc = read("docs/runtime-data-backend-boundaries.md");
  assert.match(runtimeBoundaryDoc, /Supabase Postgres/);
  assert.match(runtimeBoundaryDoc, /legacy file-backed modules/i);
  assert.match(runtimeBoundaryDoc, /PAYLOAD_DATABASE_URL/);
  assert.match(runtimeBoundaryDoc, /bootstrap CLI/i);
  assert.match(runtimeBoundaryDoc, /Transfer-hold expiry/i);

  const migrationAuditDoc = read("docs/supabase-postgres-migration-audit.md");
  assert.match(migrationAuditDoc, /project is now coherently oriented around Supabase Postgres/i);
  assert.doesNotMatch(migrationAuditDoc, /Draft creation and updates still go through the file DB routes/i);

  console.log("runtime-db-consistency: ok");
}

run();
