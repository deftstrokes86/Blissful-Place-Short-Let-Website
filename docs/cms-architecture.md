# CMS Architecture

## Purpose
This document defines the architecture for introducing Payload CMS into Blissful Place without replacing existing operational workflows.

Primary outcomes:
- Add a structured internal CMS at `/cms`
- Support blog publishing and SEO-focused content workflows
- Support role-based internal content/data management
- Keep custom operations UX in `/admin/*` and worker routes intact

## Why Payload CMS
Payload is selected because it fits the current Next.js architecture and operational model:

1. Next.js-native integration
- Payload runs inside the same app ecosystem and deployment pipeline.
- Reduces platform fragmentation versus running a separate CMS app.

2. Role-based internal access
- Payload collections support granular access functions.
- Allows strict separation across blog and inventory/admin data management.

3. Blog content management
- Supports drafts/publishing, media, categories, and SEO metadata.
- Gives non-developers a clean editorial workflow.

4. Internal user management
- CMS users and CMS roles can be managed through controlled admin collections.

5. Structured data management
- Inventory/admin-supporting collections can be managed in a controlled way while preserving service boundaries.

## Route Separation (Non-Negotiable)
The system is intentionally split by purpose:

1. CMS Management Layer
- `/cms`
- Payload admin UI and collection management surface.

2. Custom Operations Layer
- `/admin/*`
- Existing custom operational interfaces (bookings, readiness operations, task flow, inventory operations UI).
- Remains the day-to-day workflow UI for staff/admin operations.

3. Public Blog Surface
- `/blog`
- `/blog/[slug]`
- Public, SEO-indexable content routes.

## Layer Responsibilities

### Public Site
- Marketing and guest booking journey
- Blog reading experience
- No direct internal management actions

### CMS (`/cms`)
- Content editing/publishing
- CMS user and role administration
- Structured admin-support data where appropriate
- Media management

### Custom Ops (`/admin/*`, `/staff/*`)
- Operational execution and task completion
- Readiness/worker workflows
- Inventory reconciliation actions
- Booking/state-machine-driven admin operations

## Initial CMS Collection Direction
Recommended initial collections under Payload:

1. `cms-users`
- Internal CMS authentication and role assignment

2. `blog-posts`
- Editorial documents with draft/published status and SEO fields

3. `blog-categories`
- Category taxonomy for navigation and filtering

4. `blog-media`
- Shared media library for blog and internal content assets

5. `cms-inventory-items` (or similarly named scoped collection)
- Structured inventory catalog management inputs where CMS management is appropriate

## Service Boundary Rules
1. CMS does not replace domain services
- Critical operational state transitions remain in existing domain/service layers.

2. CMS does not directly mutate reservation state machine outputs
- Reservation flow remains controlled by booking services.

3. CMS data can inform operations, but not bypass existing guards
- Readiness/inventory services remain source of operational truth.

## Integration Notes
1. Payload mount
- Use `routes.admin = "/cms"`
- Use `routes.api = "/cms/api"`

2. Blog rendering
- Public routes consume only published posts.
- Draft content remains internal.

3. SEO support
- Blog post model includes SEO-specific metadata fields.

4. Coexistence
- Existing `/admin/*` and `/staff/*` remain first-class and unchanged in purpose.

## Non-Goals (Architecture)
1. Replacing worker task execution UX with CMS screens
2. Replacing custom booking/readiness operational flows with generic CMS forms
3. Building a broad ERP/marketing platform in this phase
