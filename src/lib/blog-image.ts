const SUPABASE_STORAGE_PATH_PREFIX = "/storage/v1/";
const SUPABASE_PUBLIC_OBJECT_PATH_PREFIX = "/storage/v1/object/public/";
const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function asNonEmptyString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readHostnameFromUrl(value: string | null | undefined): string | null {
  const urlValue = asNonEmptyString(value);

  if (!urlValue) {
    return null;
  }

  try {
    return new URL(urlValue).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function readConfiguredSiteHostname(): string | null {
  return readHostnameFromUrl(process.env.SITE_URL);
}

function readConfiguredSupabaseStorageHostname(): string | null {
  return readHostnameFromUrl(process.env.PAYLOAD_MEDIA_SUPABASE_ENDPOINT);
}

function readConfiguredSupabaseProjectRef(): string | null {
  return asNonEmptyString(process.env.PAYLOAD_MEDIA_SUPABASE_PROJECT_REF)?.toLowerCase() ?? null;
}

function readConfiguredSupabaseBucket(): string | null {
  return asNonEmptyString(process.env.PAYLOAD_MEDIA_SUPABASE_BUCKET) ?? asNonEmptyString(process.env.PAYLOAD_MEDIA_S3_BUCKET);
}

function isConfiguredSiteHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();
  const configuredSiteHostname = readConfiguredSiteHostname();

  if (LOCALHOST_HOSTNAMES.has(normalizedHostname)) {
    return true;
  }

  return configuredSiteHostname ? normalizedHostname === configuredSiteHostname : false;
}

function isAllowedSupabaseImageUrl(url: URL): boolean {
  const normalizedHostname = url.hostname.toLowerCase();
  const pathname = url.pathname;
  const configuredSupabaseStorageHostname = readConfiguredSupabaseStorageHostname();
  const configuredSupabaseProjectRef = readConfiguredSupabaseProjectRef();

  if (configuredSupabaseStorageHostname && normalizedHostname === configuredSupabaseStorageHostname) {
    return pathname.startsWith(SUPABASE_STORAGE_PATH_PREFIX);
  }

  if (configuredSupabaseProjectRef) {
    if (normalizedHostname === `${configuredSupabaseProjectRef}.storage.supabase.co`) {
      return pathname.startsWith(SUPABASE_STORAGE_PATH_PREFIX);
    }

    if (normalizedHostname === `${configuredSupabaseProjectRef}.supabase.co`) {
      return pathname.startsWith(SUPABASE_PUBLIC_OBJECT_PATH_PREFIX);
    }
  }

  if (normalizedHostname.endsWith(".storage.supabase.co")) {
    return pathname.startsWith(SUPABASE_STORAGE_PATH_PREFIX);
  }

  if (normalizedHostname.endsWith(".supabase.co")) {
    return pathname.startsWith(SUPABASE_PUBLIC_OBJECT_PATH_PREFIX);
  }

  return false;
}

function normalizeObjectPathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

function buildSupabaseObjectPath(prefix: string | null, filename: string | null): string | null {
  const safeFilename = asNonEmptyString(filename);

  if (!safeFilename) {
    return null;
  }

  const prefixSegments = (prefix ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map(normalizeObjectPathSegment);

  return [...prefixSegments, normalizeObjectPathSegment(safeFilename)].join("/");
}

function buildSupabasePublicObjectUrl(objectPath: string | null): string | null {
  const safeObjectPath = asNonEmptyString(objectPath);
  const bucket = readConfiguredSupabaseBucket();
  const storageHostname = readConfiguredSupabaseStorageHostname();
  const projectRef = readConfiguredSupabaseProjectRef();

  if (!safeObjectPath || !bucket) {
    return null;
  }

  const encodedBucket = encodeURIComponent(bucket);

  if (storageHostname) {
    return `https://${storageHostname}${SUPABASE_PUBLIC_OBJECT_PATH_PREFIX}${encodedBucket}/${safeObjectPath}`;
  }

  if (projectRef) {
    return `https://${projectRef}.supabase.co${SUPABASE_PUBLIC_OBJECT_PATH_PREFIX}${encodedBucket}/${safeObjectPath}`;
  }

  return null;
}

export function resolveRenderableBlogImageUrl(value: string | null | undefined): string | null {
  const trimmed = asNonEmptyString(value);

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return null;
    }

    if (isConfiguredSiteHostname(parsedUrl.hostname)) {
      return trimmed;
    }

    return isAllowedSupabaseImageUrl(parsedUrl) ? trimmed : null;
  } catch {
    return null;
  }
}

export function hasRenderableBlogImageCandidate(value: string | null | undefined): boolean {
  return resolveRenderableBlogImageUrl(value) !== null;
}

export function resolveBlogMediaDocumentUrl(value: unknown): string | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const directUrl = resolveRenderableBlogImageUrl(typeof record.url === "string" ? record.url : null);

  if (directUrl) {
    return directUrl;
  }

  const objectPath = buildSupabaseObjectPath(
    typeof record.prefix === "string" ? record.prefix : null,
    typeof record.filename === "string" ? record.filename : null
  );

  return resolveRenderableBlogImageUrl(buildSupabasePublicObjectUrl(objectPath));
}
