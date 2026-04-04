import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const SUPABASE_STORAGE_PATHNAME = "/storage/v1/**";
const SUPABASE_PUBLIC_OBJECT_PATHNAME = "/storage/v1/object/public/**";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

function createRemotePattern(hostname: string, pathname: string): RemotePattern {
  return {
    protocol: "https",
    hostname,
    pathname,
  };
}

function readSupabaseStorageHostname(): string | null {
  const endpoint = process.env.PAYLOAD_MEDIA_SUPABASE_ENDPOINT?.trim();

  if (endpoint) {
    try {
      return new URL(endpoint).hostname;
    } catch {
      // Ignore invalid URL input here and fall back to project-ref resolution.
    }
  }

  const projectRef = process.env.PAYLOAD_MEDIA_SUPABASE_PROJECT_REF?.trim();
  return projectRef ? `${projectRef}.storage.supabase.co` : null;
}

function buildSupabaseImageRemotePatterns(): RemotePattern[] {
  const patterns = new Map<string, RemotePattern>();
  const storageHostname = readSupabaseStorageHostname();
  const projectRef = process.env.PAYLOAD_MEDIA_SUPABASE_PROJECT_REF?.trim();

  const addPattern = (hostname: string, pathname: string): void => {
    if (!hostname) {
      return;
    }

    patterns.set(`${hostname}:${pathname}`, createRemotePattern(hostname, pathname));
  };

  if (storageHostname) {
    addPattern(storageHostname, SUPABASE_STORAGE_PATHNAME);
  } else {
    addPattern("**.storage.supabase.co", SUPABASE_STORAGE_PATHNAME);
  }

  if (projectRef) {
    addPattern(`${projectRef}.supabase.co`, SUPABASE_PUBLIC_OBJECT_PATHNAME);
  } else {
    addPattern("**.supabase.co", SUPABASE_PUBLIC_OBJECT_PATHNAME);
  }

  return [...patterns.values()];
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: buildSupabaseImageRemotePatterns(),
  },
};

export default withPayload(nextConfig);
