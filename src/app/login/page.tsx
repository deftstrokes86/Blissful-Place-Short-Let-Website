import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { getSharedAuthService } from "@/server/auth/auth-service-factory";
import { DEFAULT_AUTH_SESSION_COOKIE_NAME } from "@/server/auth/require-auth";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DEFAULT_AUTH_SESSION_COOKIE_NAME)?.value ?? null;

  if (sessionToken) {
    const authService = getSharedAuthService();
    const user = await authService.getCurrentSessionUser(sessionToken);

    if (user && (user.role === "admin" || user.role === "staff")) {
      redirect("/admin/bookings");
    }
  }

  return (
    <main className="auth-page">
      <section className="container auth-container">
        <div className="auth-card">
          <span className="subtitle-tag">Internal Access</span>
          <h1 className="heading-md serif">Staff Login</h1>
          <p className="text-secondary auth-copy">
            Sign in with your internal staff or admin credentials to manage reservations and operations.
          </p>

          <LoginForm />

          <p className="text-secondary auth-meta">
            Need to return to the guest site? <Link href="/">Go to homepage</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
