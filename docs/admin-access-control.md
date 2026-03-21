# Admin Access Control (Phase Scope)

## Purpose
Define route and action-level access control for internal admin/staff operations in this phase.

## Scope
This phase protects internal admin experiences and sensitive operations.
It does not introduce public guest identity features.

## Roles
- `admin`
- `staff`

## Route Protection Matrix
| Route | staff | admin | anonymous |
|---|---|---|---|
| `/admin/bookings` | allow | allow | deny |
| `/admin/availability` | allow | allow | deny |
| `/admin/notifications` | allow | allow | deny |

Notes:
- Anonymous requests must never render protected admin pages.
- Route checks must be server-enforced.

## API/Action Protection Matrix
| Capability | staff | admin | anonymous |
|---|---|---|---|
| List pending transfer reservations | allow | allow | deny |
| Verify transfer payment | allow | allow | deny |
| List pending POS reservations | allow | allow | deny |
| Confirm POS payment | allow | allow | deny |
| Cancel reservation from admin workflows | allow | allow | deny |
| Create manual availability block | allow | allow | deny |
| Release/remove manual availability block | allow | allow | deny |
| List manual availability blocks | allow | allow | deny |
| Access internal notifications log | allow | allow | deny |

## Access-Control Rules
1. Auth required for all protected routes and actions.
2. Role validation required for protected actions.
3. Server is the source of truth for authorization.
4. Client-side visibility controls are UX only, not security.

## Enforcement Boundaries
- Route boundary:
  - Gate `/admin/**` routes via server middleware/guard.
- API boundary:
  - Gate protected `/api/operations/**` endpoints via shared auth helper.
- Service boundary:
  - Services assume authenticated caller context is already established, but may assert required actor role when relevant.

## Session And Identity Requirements
- Session must map to a real internal user.
- Session must include role (`staff` or `admin`).
- Expired or invalid session must be rejected.
- Logout must revoke/expire session effectively.

## Security Requirements
- No protected admin/action response for anonymous users.
- No direct trust of request body fields for role claims.
- Auth cookie/session token must be validated on every protected request.
- Password hashes only; no plaintext storage.

## Non-Goals (Current Phase)
- No public registration.
- No guest login/signup.
- No social providers.
- No MFA.
- No broad permission matrix beyond `staff` vs `admin`.

## Testing Expectations For Access Control
- Anonymous page access denied.
- Anonymous API access denied.
- Authenticated staff can execute allowed staff/admin operations listed in scope.
- Invalid/expired sessions are denied.
- Role checks are enforced server-side.

## Future Hardening Notes
- Add audit trail for sensitive admin actions.
- Introduce finer-grained permissions as scope expands.
- Extend access controls to inventory management and other internal modules later.
