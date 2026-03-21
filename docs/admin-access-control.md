# Admin Access Control (Phase Scope)

## Purpose
Define route-level and action-level access control for internal operations in this phase.

## Scope
This phase protects internal admin/staff interfaces only.
No public guest identity features are introduced.

Login entry route:
- `/admin/secure-area`

## Roles
- `admin`
- `staff`

## Access Matrix
### Protected Routes
| Route | staff | admin | anonymous |
|---|---|---|---|
| `/admin/bookings` | allow | allow | deny |
| `/admin/availability` | allow | allow | deny |
| `/admin/notifications` | allow | allow | deny |

### Protected Backend Actions
| Capability | staff | admin | anonymous |
|---|---|---|---|
| Verify transfer payment | allow | allow | deny |
| Confirm POS payment | allow | allow | deny |
| Cancel reservation from admin workflows | allow | allow | deny |
| Create manual availability block | allow | allow | deny |
| Remove manual availability block | allow | allow | deny |
| Access internal notifications | allow | allow | deny |

## Enforcement Rules
1. All protected routes require authenticated server session checks.
2. All protected actions require server-side auth checks (not frontend-only guards).
3. Role checks must run server-side at request/action boundaries.
4. Expired/invalid sessions must be rejected.

## Redirect Rules
- Anonymous access to protected admin routes must redirect to `/admin/secure-area`.
- Successful login should redirect to the originally requested protected admin route when valid.
- Fallback redirect after login is `/admin/bookings`.
- Return targets must be restricted to safe internal admin paths to prevent open redirects.

## Security Requirements
- Password hashes only; no plaintext password storage.
- Session tokens/cookies are validated server-side on each protected request.
- Protected handlers must not trust client-provided role claims.
- Initial admin bootstrap is CLI-only and must not expose a public registration endpoint.

## Non-Goals
- No public signup/login.
- No social auth.
- No password reset in this phase.
- No MFA in this phase.
- No large RBAC matrix in this phase.

## Testing Expectations
- Anonymous page access denied.
- Anonymous action access denied.
- Authenticated allowed-role access succeeds.
- Invalid/expired session access denied.
- Redirect behavior to `/admin/secure-area` and post-login route restoration is covered.

## Future Hardening Notes
- Add audit logs for critical admin actions.
- Add finer role/permission granularity later.
- Apply the same controls to future inventory/admin modules.
