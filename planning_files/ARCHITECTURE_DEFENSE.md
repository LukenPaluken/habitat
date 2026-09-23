# Architecture & Backend Implementation Defense Guide

> **Project:** Habitat (Real Estate Marketplace)  
> **Course:** Aplicaciones Interactivas — UADE (2026)  
> **Purpose:** Comprehensive architectural documentation and defense guide covering all files created, modified, design decisions, and justification per phase.

---

## Table of Contents

1. [Core Design Principles & Architecture Overview](#1-core-design-principles--architecture-overview)
2. [Phase 0: Infrastructure & Database Setup](#2-phase-0-infrastructure--database-setup)
3. [Phase 1: Authentication & Single-Step Registration](#3-phase-1-authentication--single-step-registration)
4. [Upcoming Phases Blueprint & Justification](#4-upcoming-phases-blueprint--justification)
5. [Academic Defense Q&A Cheatsheet](#5-academic-defense-qa-cheatsheet)

---

## 1. Core Design Principles & Architecture Overview

The backend is built around **Next.js 15 App Router Route Handlers**, **PostgreSQL**, **Drizzle ORM**, **Better Auth**, and **Zod**.

### Architectural Pillars:

- **Separation of Concerns (SoC):** Database schemas, authentication configuration, input validation schemas, route handlers, and domain utilities are strictly decoupled into independent modules.
- **Strong Typing & Single Source of Truth:** Drizzle ORM schemas serve as the single source of truth for database migrations, while Zod schemas validate client payloads, inferring strict TypeScript types across the stack.
- **Fail-Fast & Server-Side Validation:** All business rules (unique agency fantasy names, state transitions, future visit dates, rating bounds) are strictly enforced at the database level (constraints/indexes) and API route handlers.
- **Relational Integrity with Zero Orphan Records:** Foreign keys with `ON DELETE CASCADE` or business-level checks prevent orphaned data.

---

## 2. Phase 0: Infrastructure & Database Setup

### Files Created / Modified:

#### 1. `drizzle.config.ts` (Created)

- **Role & Purpose:** Configuration entry point for Drizzle Kit CLI tools (`generate`, `migrate`, `push`, `studio`).
- **Key Settings:**
  - `schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"]`: Scans both domain and authentication models.
  - `out: "./src/db/migrations"`: Centralizes SQL migration files.
  - `dialect: "postgresql"`: Targets PostgreSQL database engine.
- **Defense Rationale:** Separating the Drizzle configuration allows automated SQL generation and version-controlled database migrations without hardcoding credentials or coupling build tools to runtime code.

#### 2. `src/db/index.ts` (Created)

- **Role & Purpose:** Initializes the PostgreSQL database connection client using `postgres-js` (`postgres`) and exposes the typed `db` instance.
- **Key Pattern:** Global connection singleton (`globalThis.conn`).
- **Defense Rationale:** In Next.js (App Router), development Hot Module Replacement (HMR) repeatedly re-evaluates server modules. Without a global singleton, each code reload opens new connection pools, rapidly exhausting PostgreSQL's `max_connections`. The singleton reuses active pools during dev and caps pool size safely in production.

#### 3. `src/db/schema.ts` (Modified / Enhanced)

- **Role & Purpose:** Defines the domain entities, PostgreSQL enums, database constraints, search indexes, and Drizzle relational mappings.
- **Entities Covered:**
  - `agencies`: Stores real estate agency profiles linked 1:1 to a `user.id`.
  - `properties`: Core real estate listings with types, operations, pricing, physical specs, neighborhood, and status.
  - `propertyImages`: Gallery photos with ordering and unique cover constraint (`isCover`).
  - `propertyStateHistory`: Audit log tracking state changes (`previousState` -> `newState`, timestamp).
  - `comments`: Visitor inquiries on listings with single-level seller replies (`sellerReply`).
  - `visitRequests`: In-person visit bookings with contact details, proposed date, and status.
  - `reviews`: Public agency ratings (1 to 5) and testimonials.
  - `activities`: In-app notification feed events for agency owners.
- **Enums & Constraints:**
  - Check constraints: `price > 0`, `rating >= 1 AND rating <= 5`, `area > 0`.
  - Indexes: Composite search index `(property_type, operation_type, neighborhood)` for high-performance multi-criteria search queries.
- **Defense Rationale:** Explicit Drizzle `relations(...)` enable relational queries (`db.query.properties.findFirst({ with: { images: true, agency: true } })`), eliminating boilerplate manual joins and preventing N+1 query performance degradation.

#### 4. `src/db/auth-schema.ts` (Modified / Enhanced)

- **Role & Purpose:** Declares tables required by Better Auth (`user`, `session`, `account`, `verification`) plus relation mappings back to domain models.
- **Defense Rationale:** Keeping auth tables distinct from domain entities maintains a clean boundary between authentication infrastructure and business domain entities.

#### 5. `src/db/migrations/0000_pretty_santa_claus.sql` (Generated)

- **Role & Purpose:** Version-controlled SQL DDL script generated by `bun run db:generate`.
- **Defense Rationale:** Ensures deterministic database deployments across local environments, CI/CD pipelines, and production databases without manual SQL intervention.

---

## 3. Phase 1: Authentication & Single-Step Registration

### Files Created / Modified:

#### 1. `src/lib/auth.ts` (Created)

- **Role & Purpose:** Configures and exports the server-side Better Auth engine instance.
- **Key Features:**
  - Drizzle PostgreSQL adapter integration with custom schema mapping.
  - Email + Password authentication provider enabled with `autoSignIn: true`.
  - Secret and Base URL resolution with safe local fallbacks.
- **Defense Rationale:** Better Auth provides standards-compliant session management, secure cookie handling, password hashing (Argon2/Bcrypt under the hood), and CSRF protection out of the box.

#### 2. `src/lib/auth-client.ts` (Created)

- **Role & Purpose:** Browser/Client-side SDK interface for Better Auth (`createAuthClient`).
- **Key Exports:** `signIn`, `signUp`, `signOut`, `useSession`.
- **Defense Rationale:** Exposes lightweight, React-friendly hooks and methods for client-side authentication without leaking server secrets or bundle bloat.

#### 3. `src/app/api/auth/[...all]/route.ts` (Created)

- **Role & Purpose:** Dynamic Next.js Route Handler catching all Better Auth HTTP requests (`/api/auth/*`).
- **Key Implementation:** Handled via `toNextJsHandler(auth)`.
- **Defense Rationale:** Provides an official, robust HTTP adapter that bridges Next.js App Router Request/Response primitives with the Better Auth core lifecycle.

#### 4. `src/lib/validations/auth.ts` (Created)

- **Role & Purpose:** Zod validation schemas and TypeScript type inference for authentication payloads.
- **Schemas:**
  - `registerSellerSchema`: Validates seller name, valid email, minimum password length (6+ chars), unique agency fantasy name (2+ chars), contact phone, and optional description/logo.
  - `loginSchema`: Validates email format and non-empty password.
- **Defense Rationale:** Type-safe runtime parsing at the API boundary ensures malformed or malicious inputs are rejected with descriptive errors before executing any database queries.

#### 5. `src/app/api/auth/register-seller/route.ts` (Created)

- **Role & Purpose:** Dedicated atomic registration endpoint for real estate sellers.
- **Business Logic Enforced:**
  1. Validates payload via `registerSellerSchema`.
  2. Verifies agency `fantasyName` is globally unique (case-insensitive search).
  3. Verifies user `email` is not already in use.
  4. Creates User and credentials via Better Auth (`auth.api.signUpEmail`).
  5. Inserts corresponding `agencies` record linked directly to `user.id`.
- **Defense Rationale:** Fulfills the explicit TPO requirement where a seller creates their account and their agency in a single seamless step. By performing pre-checks and sequencing the insertion, it prevents orphan users without agencies or duplicate agency names.

#### 6. `src/lib/auth-helper.ts` (Created)

- **Role & Purpose:** Reusable server-side authentication and authorization guards for protected API routes and Server Components.
- **Key Helpers:**
  - `getServerSession(headers?)`: Retrieves authenticated session.
  - `getCurrentUser(headers?)`: Resolves current user metadata.
  - `getCurrentAgency(headers?)`: Queries the database to find the agency linked to the authenticated user.
  - `requireAuth(headers?)`: Guard throwing an error if unauthenticated (401).
  - `requireAgency(headers?)`: Guard returning both user and agency, throwing if the user has no agency (403).
- **Defense Rationale:** DRY (Don't Repeat Yourself) principle. Centralizes authorization checks so individual API routes only need one line (`const { agency } = await requireAgency();`) to enforce security.

---

## 4. Upcoming Phases Blueprint & Justification

### Phase 2: Agency Management (`/api/agencies`)

- **`GET /api/agencies/me` & `PATCH /api/agencies/me`:** Private profile management for logged-in sellers.
- **`DELETE /api/agencies/me`:** Validates business rule: an agency can only be deleted if it has NO properties in `PUBLICADA` or `RESERVADA` status.
- **`GET /api/agencies/[id]`:** Public profile displaying agency details, published listings, reviews, and average rating.

### Phase 3: Properties API & Multi-Criteria Search (`/api/properties`)

- **`GET /api/properties`:** Fast public search supporting filters by type, operation, price range, neighborhood, rooms, amenities, free-text search in title/description, pagination, and sorting.
- **`POST /api/properties` & `PATCH /api/properties/[id]`:** Private CRUD for agency owners. Includes business guard: editing main data is blocked if there are pending `Confirmada` visits.
- **`PATCH /api/properties/[id]/status`:** State machine transitions (`BORRADOR` -> `PUBLICADA` <-> `PAUSADA` -> `RESERVADA` -> `VENDIDA` / `ALQUILADA` / `CANCELADA`). Records every change in `property_state_history` and triggers activity notifications.

### Phase 4: Property Images & Uploads (UploadThing)

- Handles cloud file storage, gallery order management, and enforces single cover image constraint (`isCover = true`).

### Phase 5: Comments & Inquiries (`/api/properties/[id]/comments`)

- Allows anonymous visitors to submit questions with `authorName`. Allows the agency owner to post a single `sellerReply` and generates notification.

### Phase 6: Visit Requests (`/api/properties/[id]/visits` & `/api/agencies/me/visits`)

- Allows visitors to request visits with future dates. Enables agency owners to confirm, reject, or mark as completed.

### Phase 7: Reviews (`/api/agencies/[id]/reviews`)

- Public reviews with 1–5 star ratings and aggregation calculation.

### Phase 8: Activities & Notifications (`/api/agencies/me/activities`)

- In-app notification feed tracking inquiries, visits, reviews, and unread counters.

### Phase 9: Reports & Analytics Dashboard (`/api/agencies/me/reports`)

- Aggregates property counts by status, monthly publications and closed operations, and computes average days on market from `property_state_history`.

### Phase 10: Database Seed (`src/db/seed.ts`)

- Script to populate the database with realistic demo agencies, properties, visits, comments, reviews, and history.

---

## 5. Academic Defense Q&A Cheatsheet

### Q1: Why use Drizzle ORM instead of Prisma or raw SQL?

> **Answer:** Drizzle ORM is lightweight, has near-zero runtime overhead, generates clean SQL, and provides complete type-safety. Unlike Prisma, it doesn't require a separate binary or complex generation engine, which makes it significantly faster in serverless and Bun environments. Furthermore, Drizzle's relational query API (`db.query`) enables intuitive querying while keeping full access to raw SQL expressions when needed.

### Q2: Why is the database connection handled via a singleton in `src/db/index.ts`?

> **Answer:** In Next.js App Router, the development server uses Hot Module Replacement (HMR). Every time a file is edited, server modules are reloaded. Without storing the active client on `globalThis`, each reload would instantiate a new database connection pool, quickly exhausting PostgreSQL's connection limits. The singleton ensures only one pool remains active during development.

### Q3: Why is registration implemented as a custom endpoint (`/api/auth/register-seller`) instead of default Better Auth sign-up?

> **Answer:** The TPO specification mandates that the seller account and their real estate agency must be created simultaneously in a single atomic registration step. Our custom route validates agency fantasy name uniqueness, signs up the user via Better Auth, and creates the agency profile record linked to the newly generated `user.id`, preventing orphan user accounts without agencies.

### Q4: How are property state transitions audited?

> **Answer:** Every time a property status is updated, a record is inserted into `property_state_history` recording `previousState`, `newState`, and timestamp. This table satisfies two requirements: (1) an immutable audit log of listing lifecycle events, and (2) the source of truth for computing the "Average Time on Market" metric in the reports dashboard.

### Q5: How is data integrity guaranteed without a buyer account table?

> **Answer:** Per the TPO specification, buyers/interested users are guest actors who provide lightweight contact info (`authorName`, `requesterPhone`) directly when commenting or scheduling visits. All constraints (valid rating ranges, future dates, non-empty text) are strictly validated via Zod schemas and PostgreSQL check constraints.
