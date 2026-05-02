import { NextResponse, type NextRequest } from "next/server";

const APEX_HOST = "blissfulplaceresidences.com";
const WWW_HOST = "www.blissfulplaceresidences.com";

function getRequestHostname(request: NextRequest): string {
  const host = request.headers.get("host") ?? request.nextUrl.hostname;
  return host.split(":")[0].toLowerCase();
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  if (getRequestHostname(request) === APEX_HOST) {
    const redirectUrl = url.clone();
    redirectUrl.hostname = WWW_HOST;
    redirectUrl.protocol = "https:";
    redirectUrl.port = "";

    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
