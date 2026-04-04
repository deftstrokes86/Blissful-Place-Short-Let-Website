import * as migration_20260404_023529_init_cms from './20260404_023529_init_cms';
import * as migration_20260404_034500_import_legacy_blog_content from './20260404_034500_import_legacy_blog_content';

export const migrations = [
  {
    up: migration_20260404_023529_init_cms.up,
    down: migration_20260404_023529_init_cms.down,
    name: '20260404_023529_init_cms'
  },
  {
    up: migration_20260404_034500_import_legacy_blog_content.up,
    down: migration_20260404_034500_import_legacy_blog_content.down,
    name: '20260404_034500_import_legacy_blog_content'
  },
];
