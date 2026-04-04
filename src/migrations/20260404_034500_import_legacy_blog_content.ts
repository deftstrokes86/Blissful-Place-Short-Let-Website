import type { MigrateUpArgs } from "@payloadcms/db-postgres";

import { importLegacyBlogContent, noopLegacyBlogContentRollback } from "./importLegacyBlogContent";

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await importLegacyBlogContent(payload, req);
}

export async function down(): Promise<void> {
  await noopLegacyBlogContentRollback();
}


