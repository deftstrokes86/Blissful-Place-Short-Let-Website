import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function collectPageFiles(relativeDirectoryPath) {
  const absoluteDirectoryPath = resolve(process.cwd(), relativeDirectoryPath);
  const entries = readdirSync(absoluteDirectoryPath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const relativeEntryPath = `${relativeDirectoryPath}/${entry.name}`;

    if (entry.isDirectory()) {
      return collectPageFiles(relativeEntryPath);
    }

    return entry.isFile() && entry.name === "page.tsx" ? [relativeEntryPath] : [];
  });
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
  assert.match(legacyFactory, /not a file-db fallback/i);

  const legacyCompatibilityService = read("src/server/booking/legacy-guest-reservation-service.ts");
  assert.match(legacyCompatibilityService, /despite the name, this service is Prisma-backed/i);

  const adminInventoryService = read("src/server/inventory/admin-inventory-service.ts");
  assert.match(adminInventoryService, /import \{ prisma \} from "\.\.\/db\/prisma"/);
  assert.doesNotMatch(adminInventoryService, /readBookingDatabase/);

  const authBootstrapCli = read("src/server/auth/bootstrap-cli.ts");
  assert.match(authBootstrapCli, /prismaAuthRepository/);
  assert.doesNotMatch(authBootstrapCli, /fileAuthRepository/);

  const protectedRoutePages = [
    ...collectPageFiles("src/app/(site)/admin"),
    ...collectPageFiles("src/app/(site)/staff"),
  ];

  for (const relativePath of protectedRoutePages) {
    const source = read(relativePath);
    assert.match(source, /export const dynamic = "force-dynamic"/);
    assert.doesNotMatch(source, /generateStaticParams\s*\(/);
  }

  const adminAvailabilityPage = read("src/app/(site)/admin/availability/page.tsx");
  assert.match(adminAvailabilityPage, /export const dynamic = "force-dynamic"/);
  assert.match(adminAvailabilityPage, /backLinkMode="anchor"/);

  const pageIntro = read("src/components/common/PageIntro.tsx");
  assert.match(pageIntro, /type PageIntroBackLinkMode = "client" \| "anchor"/);
  assert.match(pageIntro, /backLinkMode\?\s*:\s*PageIntroBackLinkMode/);
  assert.match(pageIntro, /navigationMode=\{backLinkMode\}/);

  const pageBackLink = read("src/components/common/PageBackLink.tsx");
  assert.match(pageBackLink, /navigationMode\?\s*:\s*PageBackLinkNavigationMode/);
  assert.match(pageBackLink, /if \(navigationMode === "anchor"\)/);
  assert.match(pageBackLink, /<a href=\{href\}/);

  const prismaSource = read("src/server/db/prisma.ts");
  assert.match(prismaSource, /export function getPrismaClient/);
  assert.match(prismaSource, /new Proxy/);
  assert.match(prismaSource, /created only when a query path touches it/i);

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

  const legacyBoundarySources = [
    "src/server/db/file-database.ts",
    "src/server/services/reservation-domain-service.ts",
    "src/server/services/availability-service.ts",
    "src/server/services/offline-payment-service.ts",
    "src/server/services/website-payment-service.ts",
    "src/server/services/idempotency-service.ts",
    "src/server/booking/file-reservation-repository.ts",
    "src/server/inventory/file-inventory-operations-repository.ts",
    "src/server/tour/file-tour-slot-repository.ts",
  ];

  for (const relativePath of legacyBoundarySources) {
    const source = read(relativePath);
    assert.match(source, /LEGACY FILE-DB BOUNDARY/);
  }

  const bookingIdempotencyContracts = read("src/server/booking/idempotency-service.ts");
  assert.match(bookingIdempotencyContracts, /FileWebsitePaymentIdempotencyGateway implementation below still uses the JSON file database/i);
  assert.match(bookingIdempotencyContracts, /prismaWebsitePaymentIdempotencyGateway/);

  const runtimeBoundaryDoc = read("docs/runtime-data-backend-boundaries.md");
  assert.match(runtimeBoundaryDoc, /Supabase Postgres/);
  assert.match(runtimeBoundaryDoc, /legacy file-backed modules/i);
  assert.match(runtimeBoundaryDoc, /PAYLOAD_DATABASE_URL/);
  assert.match(runtimeBoundaryDoc, /bootstrap CLI/i);
  assert.match(runtimeBoundaryDoc, /Transfer-hold expiry/i);
  assert.match(runtimeBoundaryDoc, /database-migration-status\.md/);
  assert.match(runtimeBoundaryDoc, /despite the name, that compatibility service is Prisma-backed/i);

  const databaseMigrationStatusDoc = read("docs/database-migration-status.md");
  assert.match(databaseMigrationStatusDoc, /Current database posture/i);
  assert.match(databaseMigrationStatusDoc, /Prisma now uses Supabase Postgres/i);
  assert.match(databaseMigrationStatusDoc, /Payload now uses Supabase Postgres in the normal path/i);
  assert.match(databaseMigrationStatusDoc, /Still on legacy file-db services/i);
  assert.match(databaseMigrationStatusDoc, /src\/server\/services\/\*/i);
  assert.match(databaseMigrationStatusDoc, /legacy-guest-reservation-service\.ts/);
  assert.match(databaseMigrationStatusDoc, /Prisma-backed compatibility adapter/i);
  assert.match(databaseMigrationStatusDoc, /pending future migration/i);
  assert.match(databaseMigrationStatusDoc, /Prisma fixed.*Payload fixed.*do not mean the entire application is fully migrated/i);

  const payloadBlogDatabaseDoc = read("docs/payload-blog-database-path.md");
  assert.match(payloadBlogDatabaseDoc, /\/blog/);
  assert.match(payloadBlogDatabaseDoc, /Payload CMS/);
  assert.match(payloadBlogDatabaseDoc, /DATABASE_URL/);
  assert.match(payloadBlogDatabaseDoc, /PAYLOAD_DATABASE_URL/);
  assert.match(payloadBlogDatabaseDoc, /file:\.\/\.data\/payload\.db/);
  assert.match(payloadBlogDatabaseDoc, /not the normal deployed blog database path/i);

  const migrationAuditDoc = read("docs/supabase-postgres-migration-audit.md");
  assert.match(migrationAuditDoc, /project is now coherently oriented around Supabase Postgres/i);
  assert.match(migrationAuditDoc, /database-migration-status\.md/);
  assert.doesNotMatch(migrationAuditDoc, /Draft creation and updates still go through the file DB routes/i);

  console.log("runtime-db-consistency: ok");
}

run();



