import { redirect } from "next/navigation";

import { DEFAULT_ADMIN_LOGIN_ROUTE } from "@/server/auth/admin-page-guard";

export default function LegacyLoginRouteRedirectPage() {
  redirect(DEFAULT_ADMIN_LOGIN_ROUTE);
}
