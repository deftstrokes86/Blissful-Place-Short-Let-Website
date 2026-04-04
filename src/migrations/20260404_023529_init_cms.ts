import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cms_users_role" AS ENUM('admin', 'inventory_manager', 'blog_manager', 'author');
  CREATE TYPE "public"."enum_cms_pages_blocks_media_split_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_cms_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cms_pages_v_blocks_media_split_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__cms_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_blog_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__blog_posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_cms_inventory_items_category" AS ENUM('asset', 'consumable', 'maintenance_supply');
  CREATE TYPE "public"."enum_cms_inventory_alerts_flat_id" AS ENUM('windsor', 'kensington', 'mayfair');
  CREATE TYPE "public"."enum_cms_inventory_alerts_alert_type" AS ENUM('low_stock', 'missing_required_item', 'damaged_critical_asset', 'readiness_issue', 'readiness_impacting_issue');
  CREATE TYPE "public"."enum_cms_inventory_alerts_severity" AS ENUM('critical', 'important', 'minor');
  CREATE TYPE "public"."enum_cms_inventory_alerts_status" AS ENUM('open', 'acknowledged', 'resolved');
  CREATE TYPE "public"."enum_cms_maintenance_issues_flat_id" AS ENUM('windsor', 'kensington', 'mayfair');
  CREATE TYPE "public"."enum_cms_maintenance_issues_severity" AS ENUM('critical', 'important', 'minor');
  CREATE TYPE "public"."enum_cms_maintenance_issues_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');
  CREATE TABLE "cms_users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "cms_users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_cms_users_role" DEFAULT 'author' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "cms_pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"subheading" varchar,
  	"background_image_id" integer,
  	"primary_action_label" varchar,
  	"primary_action_href" varchar,
  	"secondary_action_label" varchar,
  	"secondary_action_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms_pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms_pages_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"icon_name" varchar
  );
  
  CREATE TABLE "cms_pages_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms_pages_blocks_media_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb,
  	"image_id" integer,
  	"image_position" "enum_cms_pages_blocks_media_split_image_position" DEFAULT 'right',
  	"block_name" varchar
  );
  
  CREATE TABLE "cms_pages_blocks_cta_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"primary_action_label" varchar,
  	"primary_action_href" varchar,
  	"secondary_action_label" varchar,
  	"secondary_action_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "cms_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"status" "enum_cms_pages_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_id" integer,
  	"canonical_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_cms_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_cms_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"subheading" varchar,
  	"background_image_id" integer,
  	"primary_action_label" varchar,
  	"primary_action_href" varchar,
  	"secondary_action_label" varchar,
  	"secondary_action_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cms_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cms_pages_v_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"icon_name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cms_pages_v_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cms_pages_v_blocks_media_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb,
  	"image_id" integer,
  	"image_position" "enum__cms_pages_v_blocks_media_split_image_position" DEFAULT 'right',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cms_pages_v_blocks_cta_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"primary_action_label" varchar,
  	"primary_action_href" varchar,
  	"secondary_action_label" varchar,
  	"secondary_action_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cms_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_status" "enum__cms_pages_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_og_image_id" integer,
  	"version_canonical_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__cms_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "blog_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blog_tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blog_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "blog_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"featured_image_id" integer,
  	"author_id" integer,
  	"status" "enum_blog_posts_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_id" integer,
  	"canonical_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_blog_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "blog_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"blog_categories_id" integer,
  	"blog_tags_id" integer
  );
  
  CREATE TABLE "_blog_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_featured_image_id" integer,
  	"version_author_id" integer,
  	"version_status" "enum__blog_posts_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_og_image_id" integer,
  	"version_canonical_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__blog_posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_blog_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"blog_categories_id" integer,
  	"blog_tags_id" integer
  );
  
  CREATE TABLE "cms_inventory_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sku" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"category" "enum_cms_inventory_items_category" NOT NULL,
  	"unit" varchar DEFAULT 'piece' NOT NULL,
  	"is_critical" boolean DEFAULT false,
  	"reference_image_id" integer,
  	"reorder_threshold" numeric,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms_inventory_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"flat_type" varchar,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms_inventory_template_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"template_id_id" integer NOT NULL,
  	"inventory_item_id_id" integer NOT NULL,
  	"expected_quantity" numeric DEFAULT 1 NOT NULL,
  	"is_required" boolean DEFAULT true,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms_inventory_alerts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"flat_id" "enum_cms_inventory_alerts_flat_id",
  	"inventory_item_id_id" integer,
  	"alert_type" "enum_cms_inventory_alerts_alert_type" NOT NULL,
  	"severity" "enum_cms_inventory_alerts_severity" NOT NULL,
  	"status" "enum_cms_inventory_alerts_status" DEFAULT 'open' NOT NULL,
  	"message" varchar NOT NULL,
  	"resolved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms_maintenance_issues" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"flat_id" "enum_cms_maintenance_issues_flat_id" NOT NULL,
  	"inventory_item_id_id" integer,
  	"title" varchar NOT NULL,
  	"notes" varchar,
  	"severity" "enum_cms_maintenance_issues_severity" NOT NULL,
  	"status" "enum_cms_maintenance_issues_status" DEFAULT 'open' NOT NULL,
  	"resolved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cms_users_id" integer,
  	"cms_pages_id" integer,
  	"blog_categories_id" integer,
  	"blog_tags_id" integer,
  	"blog_media_id" integer,
  	"blog_posts_id" integer,
  	"cms_inventory_items_id" integer,
  	"cms_inventory_templates_id" integer,
  	"cms_inventory_template_items_id" integer,
  	"cms_inventory_alerts_id" integer,
  	"cms_maintenance_issues_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cms_users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "cms_users_sessions" ADD CONSTRAINT "cms_users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cms_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms_pages_blocks_hero" ADD CONSTRAINT "cms_pages_blocks_hero_background_image_id_blog_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms_pages_blocks_hero" ADD CONSTRAINT "cms_pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms_pages_blocks_rich_text" ADD CONSTRAINT "cms_pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms_pages_blocks_feature_grid_items" ADD CONSTRAINT "cms_pages_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cms_pages_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms_pages_blocks_feature_grid" ADD CONSTRAINT "cms_pages_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms_pages_blocks_media_split" ADD CONSTRAINT "cms_pages_blocks_media_split_image_id_blog_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms_pages_blocks_media_split" ADD CONSTRAINT "cms_pages_blocks_media_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms_pages_blocks_cta_strip" ADD CONSTRAINT "cms_pages_blocks_cta_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms_pages" ADD CONSTRAINT "cms_pages_og_image_id_blog_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cms_pages_v_blocks_hero" ADD CONSTRAINT "_cms_pages_v_blocks_hero_background_image_id_blog_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cms_pages_v_blocks_hero" ADD CONSTRAINT "_cms_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cms_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cms_pages_v_blocks_rich_text" ADD CONSTRAINT "_cms_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cms_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cms_pages_v_blocks_feature_grid_items" ADD CONSTRAINT "_cms_pages_v_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cms_pages_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cms_pages_v_blocks_feature_grid" ADD CONSTRAINT "_cms_pages_v_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cms_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cms_pages_v_blocks_media_split" ADD CONSTRAINT "_cms_pages_v_blocks_media_split_image_id_blog_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cms_pages_v_blocks_media_split" ADD CONSTRAINT "_cms_pages_v_blocks_media_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cms_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cms_pages_v_blocks_cta_strip" ADD CONSTRAINT "_cms_pages_v_blocks_cta_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cms_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cms_pages_v" ADD CONSTRAINT "_cms_pages_v_parent_id_cms_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cms_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cms_pages_v" ADD CONSTRAINT "_cms_pages_v_version_og_image_id_blog_media_id_fk" FOREIGN KEY ("version_og_image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_featured_image_id_blog_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_cms_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."cms_users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_og_image_id_blog_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_blog_tags_fk" FOREIGN KEY ("blog_tags_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_parent_id_blog_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_version_featured_image_id_blog_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_version_author_id_cms_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."cms_users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_version_og_image_id_blog_media_id_fk" FOREIGN KEY ("version_og_image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_posts_v_rels" ADD CONSTRAINT "_blog_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_blog_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_posts_v_rels" ADD CONSTRAINT "_blog_posts_v_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_posts_v_rels" ADD CONSTRAINT "_blog_posts_v_rels_blog_tags_fk" FOREIGN KEY ("blog_tags_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cms_inventory_items" ADD CONSTRAINT "cms_inventory_items_reference_image_id_blog_media_id_fk" FOREIGN KEY ("reference_image_id") REFERENCES "public"."blog_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms_inventory_template_items" ADD CONSTRAINT "cms_inventory_template_items_template_id_id_cms_inventory_templates_id_fk" FOREIGN KEY ("template_id_id") REFERENCES "public"."cms_inventory_templates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms_inventory_template_items" ADD CONSTRAINT "cms_inventory_template_items_inventory_item_id_id_cms_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id_id") REFERENCES "public"."cms_inventory_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms_inventory_alerts" ADD CONSTRAINT "cms_inventory_alerts_inventory_item_id_id_cms_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id_id") REFERENCES "public"."cms_inventory_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cms_maintenance_issues" ADD CONSTRAINT "cms_maintenance_issues_inventory_item_id_id_cms_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id_id") REFERENCES "public"."cms_inventory_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_users_fk" FOREIGN KEY ("cms_users_id") REFERENCES "public"."cms_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_pages_fk" FOREIGN KEY ("cms_pages_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_tags_fk" FOREIGN KEY ("blog_tags_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_media_fk" FOREIGN KEY ("blog_media_id") REFERENCES "public"."blog_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk" FOREIGN KEY ("blog_posts_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_inventory_items_fk" FOREIGN KEY ("cms_inventory_items_id") REFERENCES "public"."cms_inventory_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_inventory_templates_fk" FOREIGN KEY ("cms_inventory_templates_id") REFERENCES "public"."cms_inventory_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_inventory_template_item_fk" FOREIGN KEY ("cms_inventory_template_items_id") REFERENCES "public"."cms_inventory_template_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_inventory_alerts_fk" FOREIGN KEY ("cms_inventory_alerts_id") REFERENCES "public"."cms_inventory_alerts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_maintenance_issues_fk" FOREIGN KEY ("cms_maintenance_issues_id") REFERENCES "public"."cms_maintenance_issues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_cms_users_fk" FOREIGN KEY ("cms_users_id") REFERENCES "public"."cms_users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cms_users_sessions_order_idx" ON "cms_users_sessions" USING btree ("_order");
  CREATE INDEX "cms_users_sessions_parent_id_idx" ON "cms_users_sessions" USING btree ("_parent_id");
  CREATE INDEX "cms_users_updated_at_idx" ON "cms_users" USING btree ("updated_at");
  CREATE INDEX "cms_users_created_at_idx" ON "cms_users" USING btree ("created_at");
  CREATE UNIQUE INDEX "cms_users_email_idx" ON "cms_users" USING btree ("email");
  CREATE INDEX "cms_pages_blocks_hero_order_idx" ON "cms_pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "cms_pages_blocks_hero_parent_id_idx" ON "cms_pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "cms_pages_blocks_hero_path_idx" ON "cms_pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "cms_pages_blocks_hero_background_image_idx" ON "cms_pages_blocks_hero" USING btree ("background_image_id");
  CREATE INDEX "cms_pages_blocks_rich_text_order_idx" ON "cms_pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "cms_pages_blocks_rich_text_parent_id_idx" ON "cms_pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "cms_pages_blocks_rich_text_path_idx" ON "cms_pages_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "cms_pages_blocks_feature_grid_items_order_idx" ON "cms_pages_blocks_feature_grid_items" USING btree ("_order");
  CREATE INDEX "cms_pages_blocks_feature_grid_items_parent_id_idx" ON "cms_pages_blocks_feature_grid_items" USING btree ("_parent_id");
  CREATE INDEX "cms_pages_blocks_feature_grid_order_idx" ON "cms_pages_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "cms_pages_blocks_feature_grid_parent_id_idx" ON "cms_pages_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "cms_pages_blocks_feature_grid_path_idx" ON "cms_pages_blocks_feature_grid" USING btree ("_path");
  CREATE INDEX "cms_pages_blocks_media_split_order_idx" ON "cms_pages_blocks_media_split" USING btree ("_order");
  CREATE INDEX "cms_pages_blocks_media_split_parent_id_idx" ON "cms_pages_blocks_media_split" USING btree ("_parent_id");
  CREATE INDEX "cms_pages_blocks_media_split_path_idx" ON "cms_pages_blocks_media_split" USING btree ("_path");
  CREATE INDEX "cms_pages_blocks_media_split_image_idx" ON "cms_pages_blocks_media_split" USING btree ("image_id");
  CREATE INDEX "cms_pages_blocks_cta_strip_order_idx" ON "cms_pages_blocks_cta_strip" USING btree ("_order");
  CREATE INDEX "cms_pages_blocks_cta_strip_parent_id_idx" ON "cms_pages_blocks_cta_strip" USING btree ("_parent_id");
  CREATE INDEX "cms_pages_blocks_cta_strip_path_idx" ON "cms_pages_blocks_cta_strip" USING btree ("_path");
  CREATE UNIQUE INDEX "cms_pages_slug_idx" ON "cms_pages" USING btree ("slug");
  CREATE INDEX "cms_pages_og_image_idx" ON "cms_pages" USING btree ("og_image_id");
  CREATE INDEX "cms_pages_updated_at_idx" ON "cms_pages" USING btree ("updated_at");
  CREATE INDEX "cms_pages_created_at_idx" ON "cms_pages" USING btree ("created_at");
  CREATE INDEX "cms_pages__status_idx" ON "cms_pages" USING btree ("_status");
  CREATE INDEX "_cms_pages_v_blocks_hero_order_idx" ON "_cms_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_cms_pages_v_blocks_hero_parent_id_idx" ON "_cms_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_cms_pages_v_blocks_hero_path_idx" ON "_cms_pages_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_cms_pages_v_blocks_hero_background_image_idx" ON "_cms_pages_v_blocks_hero" USING btree ("background_image_id");
  CREATE INDEX "_cms_pages_v_blocks_rich_text_order_idx" ON "_cms_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_cms_pages_v_blocks_rich_text_parent_id_idx" ON "_cms_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_cms_pages_v_blocks_rich_text_path_idx" ON "_cms_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_cms_pages_v_blocks_feature_grid_items_order_idx" ON "_cms_pages_v_blocks_feature_grid_items" USING btree ("_order");
  CREATE INDEX "_cms_pages_v_blocks_feature_grid_items_parent_id_idx" ON "_cms_pages_v_blocks_feature_grid_items" USING btree ("_parent_id");
  CREATE INDEX "_cms_pages_v_blocks_feature_grid_order_idx" ON "_cms_pages_v_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "_cms_pages_v_blocks_feature_grid_parent_id_idx" ON "_cms_pages_v_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "_cms_pages_v_blocks_feature_grid_path_idx" ON "_cms_pages_v_blocks_feature_grid" USING btree ("_path");
  CREATE INDEX "_cms_pages_v_blocks_media_split_order_idx" ON "_cms_pages_v_blocks_media_split" USING btree ("_order");
  CREATE INDEX "_cms_pages_v_blocks_media_split_parent_id_idx" ON "_cms_pages_v_blocks_media_split" USING btree ("_parent_id");
  CREATE INDEX "_cms_pages_v_blocks_media_split_path_idx" ON "_cms_pages_v_blocks_media_split" USING btree ("_path");
  CREATE INDEX "_cms_pages_v_blocks_media_split_image_idx" ON "_cms_pages_v_blocks_media_split" USING btree ("image_id");
  CREATE INDEX "_cms_pages_v_blocks_cta_strip_order_idx" ON "_cms_pages_v_blocks_cta_strip" USING btree ("_order");
  CREATE INDEX "_cms_pages_v_blocks_cta_strip_parent_id_idx" ON "_cms_pages_v_blocks_cta_strip" USING btree ("_parent_id");
  CREATE INDEX "_cms_pages_v_blocks_cta_strip_path_idx" ON "_cms_pages_v_blocks_cta_strip" USING btree ("_path");
  CREATE INDEX "_cms_pages_v_parent_idx" ON "_cms_pages_v" USING btree ("parent_id");
  CREATE INDEX "_cms_pages_v_version_version_slug_idx" ON "_cms_pages_v" USING btree ("version_slug");
  CREATE INDEX "_cms_pages_v_version_version_og_image_idx" ON "_cms_pages_v" USING btree ("version_og_image_id");
  CREATE INDEX "_cms_pages_v_version_version_updated_at_idx" ON "_cms_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_cms_pages_v_version_version_created_at_idx" ON "_cms_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_cms_pages_v_version_version__status_idx" ON "_cms_pages_v" USING btree ("version__status");
  CREATE INDEX "_cms_pages_v_created_at_idx" ON "_cms_pages_v" USING btree ("created_at");
  CREATE INDEX "_cms_pages_v_updated_at_idx" ON "_cms_pages_v" USING btree ("updated_at");
  CREATE INDEX "_cms_pages_v_latest_idx" ON "_cms_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "blog_categories_slug_idx" ON "blog_categories" USING btree ("slug");
  CREATE INDEX "blog_categories_updated_at_idx" ON "blog_categories" USING btree ("updated_at");
  CREATE INDEX "blog_categories_created_at_idx" ON "blog_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_tags_slug_idx" ON "blog_tags" USING btree ("slug");
  CREATE INDEX "blog_tags_updated_at_idx" ON "blog_tags" USING btree ("updated_at");
  CREATE INDEX "blog_tags_created_at_idx" ON "blog_tags" USING btree ("created_at");
  CREATE INDEX "blog_media_updated_at_idx" ON "blog_media" USING btree ("updated_at");
  CREATE INDEX "blog_media_created_at_idx" ON "blog_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_media_filename_idx" ON "blog_media" USING btree ("filename");
  CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");
  CREATE INDEX "blog_posts_featured_image_idx" ON "blog_posts" USING btree ("featured_image_id");
  CREATE INDEX "blog_posts_author_idx" ON "blog_posts" USING btree ("author_id");
  CREATE INDEX "blog_posts_og_image_idx" ON "blog_posts" USING btree ("og_image_id");
  CREATE INDEX "blog_posts_updated_at_idx" ON "blog_posts" USING btree ("updated_at");
  CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts" USING btree ("created_at");
  CREATE INDEX "blog_posts__status_idx" ON "blog_posts" USING btree ("_status");
  CREATE INDEX "blog_posts_rels_order_idx" ON "blog_posts_rels" USING btree ("order");
  CREATE INDEX "blog_posts_rels_parent_idx" ON "blog_posts_rels" USING btree ("parent_id");
  CREATE INDEX "blog_posts_rels_path_idx" ON "blog_posts_rels" USING btree ("path");
  CREATE INDEX "blog_posts_rels_blog_categories_id_idx" ON "blog_posts_rels" USING btree ("blog_categories_id");
  CREATE INDEX "blog_posts_rels_blog_tags_id_idx" ON "blog_posts_rels" USING btree ("blog_tags_id");
  CREATE INDEX "_blog_posts_v_parent_idx" ON "_blog_posts_v" USING btree ("parent_id");
  CREATE INDEX "_blog_posts_v_version_version_slug_idx" ON "_blog_posts_v" USING btree ("version_slug");
  CREATE INDEX "_blog_posts_v_version_version_featured_image_idx" ON "_blog_posts_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_blog_posts_v_version_version_author_idx" ON "_blog_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_blog_posts_v_version_version_og_image_idx" ON "_blog_posts_v" USING btree ("version_og_image_id");
  CREATE INDEX "_blog_posts_v_version_version_updated_at_idx" ON "_blog_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_blog_posts_v_version_version_created_at_idx" ON "_blog_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_blog_posts_v_version_version__status_idx" ON "_blog_posts_v" USING btree ("version__status");
  CREATE INDEX "_blog_posts_v_created_at_idx" ON "_blog_posts_v" USING btree ("created_at");
  CREATE INDEX "_blog_posts_v_updated_at_idx" ON "_blog_posts_v" USING btree ("updated_at");
  CREATE INDEX "_blog_posts_v_latest_idx" ON "_blog_posts_v" USING btree ("latest");
  CREATE INDEX "_blog_posts_v_rels_order_idx" ON "_blog_posts_v_rels" USING btree ("order");
  CREATE INDEX "_blog_posts_v_rels_parent_idx" ON "_blog_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_blog_posts_v_rels_path_idx" ON "_blog_posts_v_rels" USING btree ("path");
  CREATE INDEX "_blog_posts_v_rels_blog_categories_id_idx" ON "_blog_posts_v_rels" USING btree ("blog_categories_id");
  CREATE INDEX "_blog_posts_v_rels_blog_tags_id_idx" ON "_blog_posts_v_rels" USING btree ("blog_tags_id");
  CREATE UNIQUE INDEX "cms_inventory_items_sku_idx" ON "cms_inventory_items" USING btree ("sku");
  CREATE INDEX "cms_inventory_items_reference_image_idx" ON "cms_inventory_items" USING btree ("reference_image_id");
  CREATE INDEX "cms_inventory_items_updated_at_idx" ON "cms_inventory_items" USING btree ("updated_at");
  CREATE INDEX "cms_inventory_items_created_at_idx" ON "cms_inventory_items" USING btree ("created_at");
  CREATE INDEX "cms_inventory_templates_updated_at_idx" ON "cms_inventory_templates" USING btree ("updated_at");
  CREATE INDEX "cms_inventory_templates_created_at_idx" ON "cms_inventory_templates" USING btree ("created_at");
  CREATE INDEX "cms_inventory_template_items_template_id_idx" ON "cms_inventory_template_items" USING btree ("template_id_id");
  CREATE INDEX "cms_inventory_template_items_inventory_item_id_idx" ON "cms_inventory_template_items" USING btree ("inventory_item_id_id");
  CREATE INDEX "cms_inventory_template_items_updated_at_idx" ON "cms_inventory_template_items" USING btree ("updated_at");
  CREATE INDEX "cms_inventory_template_items_created_at_idx" ON "cms_inventory_template_items" USING btree ("created_at");
  CREATE INDEX "cms_inventory_alerts_inventory_item_id_idx" ON "cms_inventory_alerts" USING btree ("inventory_item_id_id");
  CREATE INDEX "cms_inventory_alerts_updated_at_idx" ON "cms_inventory_alerts" USING btree ("updated_at");
  CREATE INDEX "cms_inventory_alerts_created_at_idx" ON "cms_inventory_alerts" USING btree ("created_at");
  CREATE INDEX "cms_maintenance_issues_inventory_item_id_idx" ON "cms_maintenance_issues" USING btree ("inventory_item_id_id");
  CREATE INDEX "cms_maintenance_issues_updated_at_idx" ON "cms_maintenance_issues" USING btree ("updated_at");
  CREATE INDEX "cms_maintenance_issues_created_at_idx" ON "cms_maintenance_issues" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_cms_users_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_users_id");
  CREATE INDEX "payload_locked_documents_rels_cms_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_pages_id");
  CREATE INDEX "payload_locked_documents_rels_blog_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_categories_id");
  CREATE INDEX "payload_locked_documents_rels_blog_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_tags_id");
  CREATE INDEX "payload_locked_documents_rels_blog_media_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_media_id");
  CREATE INDEX "payload_locked_documents_rels_blog_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_posts_id");
  CREATE INDEX "payload_locked_documents_rels_cms_inventory_items_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_inventory_items_id");
  CREATE INDEX "payload_locked_documents_rels_cms_inventory_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_inventory_templates_id");
  CREATE INDEX "payload_locked_documents_rels_cms_inventory_template_ite_idx" ON "payload_locked_documents_rels" USING btree ("cms_inventory_template_items_id");
  CREATE INDEX "payload_locked_documents_rels_cms_inventory_alerts_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_inventory_alerts_id");
  CREATE INDEX "payload_locked_documents_rels_cms_maintenance_issues_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_maintenance_issues_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_cms_users_id_idx" ON "payload_preferences_rels" USING btree ("cms_users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cms_users_sessions" CASCADE;
  DROP TABLE "cms_users" CASCADE;
  DROP TABLE "cms_pages_blocks_hero" CASCADE;
  DROP TABLE "cms_pages_blocks_rich_text" CASCADE;
  DROP TABLE "cms_pages_blocks_feature_grid_items" CASCADE;
  DROP TABLE "cms_pages_blocks_feature_grid" CASCADE;
  DROP TABLE "cms_pages_blocks_media_split" CASCADE;
  DROP TABLE "cms_pages_blocks_cta_strip" CASCADE;
  DROP TABLE "cms_pages" CASCADE;
  DROP TABLE "_cms_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_cms_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_cms_pages_v_blocks_feature_grid_items" CASCADE;
  DROP TABLE "_cms_pages_v_blocks_feature_grid" CASCADE;
  DROP TABLE "_cms_pages_v_blocks_media_split" CASCADE;
  DROP TABLE "_cms_pages_v_blocks_cta_strip" CASCADE;
  DROP TABLE "_cms_pages_v" CASCADE;
  DROP TABLE "blog_categories" CASCADE;
  DROP TABLE "blog_tags" CASCADE;
  DROP TABLE "blog_media" CASCADE;
  DROP TABLE "blog_posts" CASCADE;
  DROP TABLE "blog_posts_rels" CASCADE;
  DROP TABLE "_blog_posts_v" CASCADE;
  DROP TABLE "_blog_posts_v_rels" CASCADE;
  DROP TABLE "cms_inventory_items" CASCADE;
  DROP TABLE "cms_inventory_templates" CASCADE;
  DROP TABLE "cms_inventory_template_items" CASCADE;
  DROP TABLE "cms_inventory_alerts" CASCADE;
  DROP TABLE "cms_maintenance_issues" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_cms_users_role";
  DROP TYPE "public"."enum_cms_pages_blocks_media_split_image_position";
  DROP TYPE "public"."enum_cms_pages_status";
  DROP TYPE "public"."enum__cms_pages_v_blocks_media_split_image_position";
  DROP TYPE "public"."enum__cms_pages_v_version_status";
  DROP TYPE "public"."enum_blog_posts_status";
  DROP TYPE "public"."enum__blog_posts_v_version_status";
  DROP TYPE "public"."enum_cms_inventory_items_category";
  DROP TYPE "public"."enum_cms_inventory_alerts_flat_id";
  DROP TYPE "public"."enum_cms_inventory_alerts_alert_type";
  DROP TYPE "public"."enum_cms_inventory_alerts_severity";
  DROP TYPE "public"."enum_cms_inventory_alerts_status";
  DROP TYPE "public"."enum_cms_maintenance_issues_flat_id";
  DROP TYPE "public"."enum_cms_maintenance_issues_severity";
  DROP TYPE "public"."enum_cms_maintenance_issues_status";`)
}
