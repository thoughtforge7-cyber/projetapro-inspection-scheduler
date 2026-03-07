# Texas Builders Alliance (TBA) — MVP Architecture Blueprint

## 1) Recommended MVP System Architecture

### Architectural style: **Modular monolith** (single deployable backend)
For MVP, the best fit is a modular monolith with strict internal domain boundaries:

- **One backend** service (as requested)
- **One database** (PostgreSQL)
- **One authentication system**
- **Role-based dashboards and permissions**

This gives fast delivery and low operational complexity while preserving a migration path to microservices later if needed.

### High-level components

1. **Web App (Next.js, responsive)**
   - Public pages + authenticated app
   - Role-aware navigation and dashboards
   - Context-driven inbox/messages

2. **Backend API (NestJS or Express+TypeScript, monolith)**
   - Domain modules:
     - Auth & Identity
     - Organizations & Roles
     - Projects
     - Deals
     - Scopes/Demands
     - Quotations/Proposals
     - Contextual Messaging
     - Membership & Billing flags
     - Verification & Trust
     - Admin
   - Shared permission engine (RBAC + context rules)

3. **PostgreSQL**
   - Main relational store for all transactional data
   - JSONB for flexible metadata where appropriate

4. **Async jobs (Redis + queue, optional in MVP)**
   - Email notifications
   - Digest notifications
   - Verification reminders

5. **Storage (S3-compatible)**
   - Profile docs, project docs, proposals attachments

### Why this is best for MVP
- Fast to build with a small team
- Easier permission consistency (single codebase, single policy layer)
- Lower cost/DevOps overhead
- Can scale vertically first, then split modules by bounded context later

---

## 2) Proposed Database Schema (Core Entities)

> Use UUID primary keys, `created_at`, `updated_at`, `deleted_at` (soft delete where needed).

### Identity & Access
- `users`
  - id, email, phone, password_hash, status, last_login_at
- `profiles`
  - user_id (1:1), full_name, company_name, bio, location, avatar_url
- `roles`
  - id, code (`gc`, `subcontractor`, `freelancer`, `investor`, `realtor`, `client_free`, `client_membership`, `partner`, `admin`)
- `user_roles`
  - user_id, role_id, is_primary
- `permissions` (optional seed table)
- `role_permissions` (if not fully hardcoded)

### Organizations
- `organizations`
  - id, type (`gc_firm`, `subcontractor_firm`, `partner_company`, etc.), name, owner_user_id
- `organization_members`
  - organization_id, user_id, member_role

### Core business contexts
- `projects`
  - id, gc_org_id (or gc_user_id), name, category, status, location, budget_range, timeline_start, timeline_end, visibility
- `project_participants`
  - project_id, user_id/org_id, participant_type (`subcontractor`,`freelancer`,`client`,`partner`), invited_by, status

- `deals`
  - id, created_by_user_id, creator_role (`investor`/`realtor`), title, description, location, estimated_value, status
- `deal_participants`
  - deal_id, user_id/org_id, participant_type, status

- `scopes`
  - id, created_by_user_id (membership client), title, description, trade_type, location, budget_range, due_date, status
- `scope_requirements`
  - scope_id, requirement_type, value_json

### Quotation/Proposal workflow
- `requests`
  - id, context_type (`project`,`deal`,`scope`), context_id, requested_by_user_id, target_role (`gc`,`subcontractor`,`freelancer`), deadline, status
- `proposals`
  - id, request_id, submitted_by_user_id/org_id, amount, duration_days, cover_note, status (`submitted`,`shortlisted`,`accepted`,`rejected`,`withdrawn`)
- `proposal_items`
  - proposal_id, item_name, qty, unit_price, notes

### Contextual communication
- `conversations`
  - id, context_type (`project`,`deal`,`scope`,`request`,`invitation`), context_id, created_by
- `conversation_participants`
  - conversation_id, user_id, role_snapshot
- `messages`
  - id, conversation_id, sender_user_id, body, attachment_url, sent_at

### Membership & trust
- `memberships`
  - user_id, plan (`free`,`membership`), status, starts_at, ends_at
- `verifications`
  - id, user_id/org_id, verification_type (`license`,`insurance`,`identity`,`business`), status, reviewed_by_admin, reviewed_at
- `trust_scores` (placeholder)
  - user_id/org_id, score, last_calculated_at
- `reviews` (placeholder minimal)
  - id, reviewer_user_id, target_user_id/org_id, context_type, context_id, rating, comment

### Admin & audit
- `admin_actions`
  - id, admin_user_id, action_type, target_type, target_id, reason, payload_json, created_at
- `audit_logs`
  - id, actor_user_id, entity_type, entity_id, event_type, before_json, after_json, created_at

---

## 3) Core API Routes (v1)

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

### Users, Profiles, Roles
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id/profile`
- `GET /api/v1/users/:id/roles`
- `POST /api/v1/users/:id/roles` (admin/system controlled)

### Projects (GC-centered)
- `POST /api/v1/projects` (GC only)
- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id`
- `POST /api/v1/projects/:id/invitations`
- `POST /api/v1/projects/:id/participants/:participantId/approve`

### Deals (Investor/Realtor)
- `POST /api/v1/deals` (Investor/Realtor)
- `GET /api/v1/deals`
- `GET /api/v1/deals/:id`
- `PATCH /api/v1/deals/:id`
- `POST /api/v1/deals/:id/invitations`

### Scopes/Demands (Membership Client)
- `POST /api/v1/scopes` (Client Membership only)
- `GET /api/v1/scopes`
- `GET /api/v1/scopes/:id`
- `PATCH /api/v1/scopes/:id`
- `POST /api/v1/scopes/:id/publish`

### Requests & Proposals
- `POST /api/v1/requests` (from project/deal/scope contexts)
- `GET /api/v1/requests/:id`
- `POST /api/v1/requests/:id/proposals`
- `GET /api/v1/requests/:id/proposals`
- `POST /api/v1/proposals/:id/shortlist`
- `POST /api/v1/proposals/:id/accept`
- `POST /api/v1/proposals/:id/reject`

### Contextual Messaging
- `POST /api/v1/conversations` (must include valid context)
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/:id/messages`
- `POST /api/v1/conversations/:id/messages`

### Membership / Verification
- `GET /api/v1/membership/me`
- `POST /api/v1/membership/upgrade`
- `POST /api/v1/verifications`
- `GET /api/v1/verifications/me`

### Admin
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users/:id/verify`
- `POST /api/v1/admin/users/:id/suspend`
- `GET /api/v1/admin/verifications`
- `POST /api/v1/admin/verifications/:id/review`
- `GET /api/v1/admin/audit-logs`

---

## 4) Role Permissions (MVP)

### Permission model
Use **RBAC + context policy checks**:
1. RBAC grants baseline actions by role.
2. Context policy validates resource linkage (project/deal/scope membership, invitation status, ownership).

### Baseline matrix (simplified)

- **General Contractor (GC)**
  - Can create/manage projects
  - Can invite subcontractors/freelancers/clients/partners into project context
  - Can request and accept proposals in project context

- **Subcontractor / Freelancer**
  - Cannot create projects/deals
  - Can receive invitations and submit proposals where invited/eligible
  - Can message only in approved contexts

- **Investor / Realtor**
  - Can create/manage deals
  - Can invite participants in deal context
  - Can request/receive proposals tied to deals

- **Client Free**
  - Can browse directory/listings
  - Can directly contact GC/Subcontractor/Freelancer (controlled channels)
  - Cannot create structured scopes
  - Cannot run multi-quote formal workflow

- **Client Membership**
  - Can create scopes/demands
  - Can receive formal quotations via scope requests
  - Can manage scope-specific conversations

- **Partner / Indirect Provider**
  - No cold outreach
  - Can participate only when added to context (project/deal/scope/invitation)

- **Admin**
  - User verification, moderation, audit review, role correction

### Key hard rules to enforce in policy layer
- Only GC can create projects.
- Only Investor/Realtor can create deals.
- Only Client Membership can create scopes.
- Messaging requires valid shared context (or allowed direct-contact exception for Client Free).
- Partner cannot initiate conversations without contextual link.

---

## 5) Frontend App Structure (Web-first)

### App shell
- Next.js App Router
- Route groups by concerns:
  - `(public)` landing/about/directory
  - `(auth)` login/register
  - `(app)` authenticated dashboards

### Suggested structure
- `app/(app)/dashboard/page.tsx` (role-aware landing)
- `app/(app)/projects/*`
- `app/(app)/deals/*`
- `app/(app)/scopes/*`
- `app/(app)/requests/*`
- `app/(app)/messages/*`
- `app/(app)/profile/*`
- `app/(admin)/*`

### Frontend patterns
- Server components for data-heavy pages
- Client components for forms/interactions
- Central API client + auth token refresh
- Permission-aware UI guards (hide + disable)
- Final authorization always validated on backend

---

## 6) Admin Panel Structure

### Sections
1. **Users**: search, role assignment, suspend/reactivate
2. **Verifications**: review docs, approve/reject with reason
3. **Memberships**: plan status, manual overrides (MVP minimal)
4. **Content moderation**: reported profiles/messages (basic)
5. **Audit logs**: critical action traceability
6. **System settings**: role toggles, feature flags (minimal)

### Admin controls to include from day one
- Verify/unverify user or company
- Suspend/reactivate account
- Resolve verification submissions
- Review dispute metadata for proposals/messages

---

## 7) Best Tech Stack for Fast MVP Delivery

### Recommended stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: NestJS + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (access/refresh) + bcrypt, with email verification
- **File storage**: S3-compatible (AWS S3 or MinIO)
- **Queue (optional early)**: BullMQ + Redis
- **Infra**: Docker Compose for local, single cloud VM or managed platform for MVP
- **Observability**: basic structured logs + error tracking (Sentry)

### Why this stack
- TypeScript end-to-end reduces context switching
- Prisma accelerates schema iteration
- NestJS gives modular organization and guard-based auth
- Next.js is strong for web-first responsive and hybrid public/app experiences

---

## 8) Build Now vs Build Later

### Build now (MVP)
- Auth + role assignment + profile setup
- Project, deal, scope core CRUD with strict creator rules
- Request/proposal lifecycle (submit, shortlist, accept/reject)
- Contextual messaging tied to entities
- Membership gating (free vs membership)
- Basic verification workflow (submit/review/status)
- Admin essentials (users, verifications, suspensions, audit)

### Build later (Post-MVP)
- Automated trust score engine
- Advanced matching/recommendation
- Rich analytics dashboards per role
- Full billing/subscription automation
- Mobile apps (React Native)
- Advanced compliance/KYC integrations
- Real-time collaboration docs and versioning

---

## 9) Riskiest Architectural Decisions

1. **Permission complexity risk**
   - Risk: hidden edge cases and privilege leaks.
   - Mitigation: centralized policy engine + policy tests per role/context.

2. **Contextual messaging rule enforcement**
   - Risk: accidental social-network behavior or cold outreach loopholes.
   - Mitigation: conversation creation requires context_type/context_id policy checks.

3. **Role overlap and multi-role users**
   - Risk: conflicting capabilities for users with multiple roles.
   - Mitigation: explicit active-role selection per session + union permissions constrained by context.

4. **Flexible but clean schema evolution**
   - Risk: over-normalization slows delivery, under-normalization causes inconsistencies.
   - Mitigation: normalized core + JSONB for non-critical extensibility.

5. **Future decomposition path**
   - Risk: tightly coupled modules if boundaries are unclear.
   - Mitigation: enforce internal module APIs and domain events even in monolith.

---

## 10) Clean Technical Delivery Plan

### Phase 0 (1 week)
- Domain modeling workshop
- Schema + API contracts
- Auth + base role model scaffolding

### Phase 1 (2–3 weeks)
- Profiles, roles, membership flags
- Projects/deals/scopes CRUD with policy checks
- Admin user + verification basics

### Phase 2 (2–3 weeks)
- Requests/proposals workflow
- Contextual messaging
- Audit logs + basic notifications

### Phase 3 (1 week hardening)
- Permission/security testing
- Performance pass on key list endpoints
- Launch checklist (backups, monitoring, alerts)

---

## Implementation Principle Summary
- Keep architecture **modular but single-service**.
- Make **permissions first-class** (not scattered conditionals).
- Enforce **context-bound interactions** to preserve product identity.
- Ship narrow, high-confidence workflows before intelligence features.
