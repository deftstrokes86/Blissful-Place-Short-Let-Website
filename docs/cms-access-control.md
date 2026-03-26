# CMS Access Control

## Purpose
Define role-based CMS permissions for blog and inventory/admin data management while keeping operational UIs separate.

## Principle
CMS authorization is scoped and explicit.

Rules:
1. Least privilege by default
2. Role scope separation is enforced at collection access level
3. Operational worker/admin UIs remain separate from CMS authorization concerns

## Role Model

### 1. `admin`
Access:
- Blog collections (full)
- Inventory/admin CMS collections (full)
- CMS user management (full)

Use case:
- Internal leadership/admin owner of both content and structured internal datasets.

### 2. `inventory_manager`
Access:
- Inventory/admin CMS collections only
- No blog management collections
- No CMS user management

Use case:
- Internal manager responsible for inventory-related structured records.

### 3. `blog_manager`
Access:
- Blog/content collections only
- No inventory/admin collections
- No CMS user management (unless explicitly granted later)

Use case:
- Editorial/content manager controlling blog operations.

### 4. `author`
Access:
- Blog drafting scope only
- Can create/edit own draft posts
- Publish permissions optional by policy (default: restricted)
- No inventory/admin collections

Use case:
- Content contributor/writer.

## Access Rules (Collection-Level)

### Blog Collections (`blog-posts`, `blog-categories`, `blog-media`)
1. `admin`: create/read/update/delete
2. `blog_manager`: create/read/update/delete
3. `author`: create/read/update own drafts (publish rules policy-bound)
4. `inventory_manager`: no access

### Inventory/Admin CMS Collections (e.g., `cms-inventory-items`)
1. `admin`: create/read/update/delete
2. `inventory_manager`: create/read/update/delete (as scoped)
3. `blog_manager`: no access
4. `author`: no access

### CMS User Collection (`cms-users`)
1. `admin`: create/read/update/delete
2. `inventory_manager`: no access
3. `blog_manager`: no access
4. `author`: no access

## Public Access Rules
1. Public users can read only published blog content via `/blog` and `/blog/[slug]`
2. Draft content is never publicly visible
3. Public users do not access `/cms`

## Route Separation and Authorization Context
1. `/cms`
- Payload CMS UI
- Uses CMS role model above

2. `/admin/*` and `/staff/*`
- Existing custom operational UIs
- Continue using existing internal auth/guards
- Not replaced by CMS role model

## Non-Goals (Access Control)
1. Do not replace worker task UI with CMS
2. Do not build public customer-account CMS auth
3. Do not build enterprise-wide permission matrix beyond current role scope

## Audit and Safety Expectations
1. Access rules implemented as server-side collection access functions
2. No reliance on client-side hiding for security
3. Role boundaries tested for allow/deny behavior
4. Critical collections default to deny unless explicitly allowed

## Implementation Readiness Checklist
1. Role enums/types documented and implemented
2. Collection-level access policies mapped to roles
3. Public read constraints for blog publication status documented
4. Route-level separation documented and enforced
5. Tests added for critical role boundary cases
