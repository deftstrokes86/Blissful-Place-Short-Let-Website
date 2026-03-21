# Authentication (Phase Scope)

## Purpose
Define the minimal internal authentication scope for protecting staff/admin surfaces in this phase.

## 1) Scope
In scope:
- Internal `admin`/`staff` protection only.
- Session-based authentication for protected admin pages and admin APIs/actions.
- Server-side enforcement for route and action protection.

Out of scope:
- Public guest accounts.
- Guest signup/login.
- Social auth.
- Password reset.
- MFA.
- Large RBAC matrix.

## 2) Roles And Access Surface
Roles:
- `admin`
- `staff`

Login route:
- `/admin/secure-area`

Protected routes (minimum):
- `/admin/bookings`
- `/admin/availability`
- `/admin/notifications`

Protected backend actions (minimum):
- Transfer verification.
- POS confirmation.
- Reservation cancellation from admin workflows.
- Manual availability block creation/removal.
- Internal notification access.

## 3) Required Auth Capabilities
1. Login
- Accept staff/admin credentials.
- Validate credentials server-side.

2. Logout
- Invalidate server session.
- Clear auth cookie/token.

3. Session validation
- Validate session on every protected page/API request.
- Reject expired/invalid sessions.

4. Route protection
- Protected admin pages require valid authenticated session.

5. Action/API protection
- Protected admin actions require auth server-side.
- Never trust frontend visibility checks for security.

6. Role-aware checks
- Enforce allowed roles (`admin`, `staff`) at server boundary.

## 4) Redirect Behavior
- Unauthenticated access to protected admin routes must redirect to `/admin/secure-area`.
- On successful login, redirect to the originally requested admin route when present and valid.
- If no valid requested route is present, redirect to `/admin/bookings`.
- Requested-route handling must be sanitized to internal admin paths (for example, `/admin/*`) to avoid open redirects.

## 5) Security Expectations
- Passwords must be hashed (never stored in plaintext).
- Sessions must be server-validated.
- Protected actions must not trust frontend checks alone.
- Admin routes must not be readable by anonymous users.
- Use secure cookie/session defaults (`HttpOnly`, `SameSite`, `Secure` in production).

## 6) Bootstrap (Internal Setup)
A one-time internal bootstrap path can create the first staff/admin user for development or internal setup.

Bootstrap safety rules:
- Disabled by default via `AUTH_BOOTSTRAP_ENABLED=false`.
- Must be explicitly enabled per run.
- Idempotent for the same email (does not create duplicates).
- Blocked once internal users already exist (except idempotent same-email reruns).
- Passwords are hashed through normal auth service flow.
- No public signup route is introduced.
- No conflict with `/admin/secure-area`: bootstrap is CLI-only, not a public web endpoint.

### Development Runbook
1. Set env vars in your local `.env`:
- `AUTH_BOOTSTRAP_ENABLED=true`
- `AUTH_BOOTSTRAP_EMAIL=<internal-email>`
- `AUTH_BOOTSTRAP_PASSWORD=<strong-password>`
- `AUTH_BOOTSTRAP_ROLE=admin` (or `staff`)

2. Run:
```bash
npm run auth:bootstrap
```

3. Disable bootstrap again:
- Set `AUTH_BOOTSTRAP_ENABLED=false`

4. Sign in at:
- `/admin/secure-area`

## 7) Non-Goals
- No public registration.
- No guest auth.
- No social providers.
- No MFA.
- No expanded enterprise permission model in this phase.

## 8) Future-Ready Notes
- Add audit logging for auth events and sensitive admin actions.
- Add finer-grained permissions when needed.
- Reuse this protection model for future inventory/admin surfaces.
