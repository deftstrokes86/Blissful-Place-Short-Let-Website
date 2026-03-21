# Authentication (Phase Scope)

## Purpose
This document defines the authentication scope for the current internal protection phase.
It is intentionally limited to admin and staff access control.

## In Scope (Current Phase)
- Internal staff/admin authentication only.
- Protect internal admin pages and sensitive admin APIs.
- Server-validated session model.
- Role-aware access checks for `admin` and `staff`.

## Out of Scope (Current Phase)
- Public guest account system.
- Guest signup/login.
- Social login.
- Password reset flow.
- MFA.
- Full enterprise RBAC model.

## Roles
- `admin`
- `staff`

## Required Auth Capabilities
1. Login
- Staff/admin can authenticate using internal credentials.
- Credentials are validated server-side.

2. Logout
- Session invalidation endpoint/action.
- Session cookie is cleared on logout.

3. Session Validation
- Every protected page/API validates session server-side.
- Frontend state alone is never trusted.

4. Route Protection
- Anonymous users cannot access protected admin routes.
- Unauthorized users are redirected to login or shown 401/403 depending on route type.

5. Action/API Protection
- Sensitive backend actions require a valid authenticated session.
- Role checks are applied server-side before action execution.

6. Role-Aware Checks
- `staff` and `admin` share most operational actions in this phase.
- `admin` may retain access to everything staff can access.

## Protected Routes (Minimum)
- `/admin/bookings`
- `/admin/availability`
- `/admin/notifications`

## Protected Backend Actions (Minimum)
- Transfer verification.
- POS confirmation.
- Reservation cancellation (admin workflows).
- Manual availability block creation/removal.
- Internal notification log access.

## Recommended Minimal Technical Direction
1. Credential Store
- Internal user records with role and password hash.
- Passwords are never stored in plaintext.

2. Password Handling
- Use strong one-way hashing (e.g., bcrypt/argon2).
- Verify hash server-side on login.

3. Session Model
- Session id in secure, httpOnly cookie.
- Session record stored server-side with user id, role, expiry.
- Session validation middleware/helper used by pages and API handlers.

4. Access Helper Layer
- Central helper for:
  - `requireAuthenticatedSession`
  - `requireRole(["staff", "admin"])`
- Avoid duplicating auth checks inside each route handler.

5. Error Handling
- Page requests: redirect unauthenticated users to login.
- API requests: return 401 unauthenticated, 403 unauthorized.

## Security Expectations
- Passwords must be hashed.
- Sessions must be validated server-side.
- Protected actions must not rely on frontend-only checks.
- Admin routes must not be readable by anonymous users.
- Auth cookies should use secure defaults (`httpOnly`, `secure` in prod, `sameSite`).

## Implementation Sequence (Auth Phase)
1. Add internal user + session domain types/models.
2. Add login/logout/session service.
3. Add server auth guard helpers.
4. Protect admin routes.
5. Protect sensitive operations APIs.
6. Add focused tests for auth gates and role checks.

## Future Notes
- Add audit logging for auth events and critical admin actions.
- Add stronger permission granularity later.
- Expand protection to future inventory-management surfaces.
## Initial Bootstrap (Internal Setup)
Use a one-time internal bootstrap command to create the first admin/staff user.
No public signup route is introduced.

### Command
Run:

```bash
npm run auth:bootstrap
```

### Required Environment Variables
Set these before running bootstrap:
- `AUTH_BOOTSTRAP_ENABLED=true`
- `AUTH_BOOTSTRAP_EMAIL=<internal-email>`
- `AUTH_BOOTSTRAP_PASSWORD=<strong-password>`
- `AUTH_BOOTSTRAP_ROLE=admin` or `staff`

Defaults in `.env.example` keep bootstrap disabled.

### Safety Rules
- Bootstrap is blocked unless `AUTH_BOOTSTRAP_ENABLED=true`.
- Bootstrap creates a user only when no internal users exist.
- If the same email already exists, bootstrap is idempotent and does not create duplicates.
- Passwords are hashed through the normal auth service flow.
- No permanent bootstrap API endpoint is exposed.

### Recommended Dev Flow
1. Set bootstrap env vars in local env.
2. Run `npm run auth:bootstrap` once.
3. Set `AUTH_BOOTSTRAP_ENABLED=false` again.
4. Sign in through `/login` with the bootstrapped account.

