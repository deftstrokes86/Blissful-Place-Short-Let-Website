import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DEFAULT_ADMIN_LOGIN_ROUTE } from "@/server/auth/admin-page-guard";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LegacyLoginRouteRedirectPage() {
  redirect(DEFAULT_ADMIN_LOGIN_ROUTE);
}
