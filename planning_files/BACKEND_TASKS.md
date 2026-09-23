# Backend Roadmap — Habitat (TPO UADE)

Minimum necessary tasks to complete the backend according to `planning_files/tpo.md`.

---

## [x] 0. Infrastructure & Database Setup

- [x] Configure Drizzle ORM (`drizzle.config.ts`, PostgreSQL client in `src/db/index.ts`).
- [x] Schema & relations for all domain entities (`schema.ts` and `auth-schema.ts`).
- [x] Generate initial migration (`src/db/migrations/0000_pretty_santa_claus.sql`).

---

## [x] 1. Authentication & Registration (`/api/auth`)

- [x] Configure Better Auth with Drizzle adapter in `src/lib/auth.ts`.
- [x] Route handler at `src/app/api/auth/[...all]/route.ts`.
- [x] Atomic registration endpoint (`POST /api/auth/register-seller`) linking User + Agency in a single flow.
- [x] Server auth helpers (`getServerSession()`, `getCurrentUser()`, `getCurrentAgency()`, `requireAuth()`, `requireAgency()`) in `src/lib/auth-helper.ts`.
- [x] Client auth helpers (`authClient`, `signIn`, `signUp`, `signOut`, `useSession`) in `src/lib/auth-client.ts`.
- [x] Zod validation schema for registration and login in `src/lib/validations/auth.ts`.

> **Task 1 Implementation Note:**
>
> - Initialized Better Auth engine with Drizzle PostgreSQL adapter (`src/lib/auth.ts`).
> - Created Next.js Route Handler for all Better Auth endpoints (`src/app/api/auth/[...all]/route.ts`).
> - Created atomic seller registration (`src/app/api/auth/register-seller/route.ts`) that validates unique fantasy name, creates user credentials, and stores the associated agency profile.
> - Implemented server-side session and agency guards (`src/lib/auth-helper.ts`) to secure future protected routes.

---

## [ ] 2. Agency Endpoints (`/api/agencies`)

- [ ] `GET /api/agencies/me`: Current agency profile.
- [ ] `PATCH /api/agencies/me`: Edit agency details (description, logo, phone, address).
- [ ] `DELETE /api/agencies/me`: Delete agency (only if no `PUBLICADA` or `RESERVADA` properties).
- [ ] `GET /api/agencies/[id]`: Public agency page (contact info, public listings, average rating, reviews).

---

## [ ] 3. Properties & Search (`/api/properties`)

- [ ] `GET /api/properties`: Public listing with multi-criteria filters:
  - Type (`Casa`, `Departamento`, `Terreno`, `Local`).
  - Operation (`Venta`, `Alquiler`).
  - Price range & currency (`ARS` / `USD`).
  - Neighborhood/zone, rooms, bedrooms, bathrooms.
  - Amenities/tags and free-text search in title/description.
  - Sorting (price, date, area) and pagination.
- [ ] `POST /api/properties`: Create property (starts in `BORRADOR` or `PUBLICADA`).
- [ ] `GET /api/properties/[id]`: Full property details with gallery, agency, and Q&A.
- [ ] `PATCH /api/properties/[id]`: Edit property (blocked if property has pending `Confirmada` visits).
- [ ] `PATCH /api/properties/[id]/status`: State transitions (`BORRADOR` -> `PUBLICADA` <-> `PAUSADA` -> `RESERVADA` -> `VENDIDA` / `ALQUILADA` / `CANCELADA`).
  - Logs every change in `property_state_history`.
  - Dispatches activity notification.

---

## [ ] 4. Property Images & Uploads

- [ ] Configure UploadThing route handler in `src/app/api/uploadthing/route.ts`.
- [ ] `POST /api/properties/[id]/images`: Attach uploaded images to property.
- [ ] `DELETE /api/properties/[id]/images/[imageId]`: Remove image.
- [ ] `PATCH /api/properties/[id]/images/[imageId]/cover`: Set cover image (`isCover = true`).

---

## [ ] 5. Comments & Inquiries (`/api/properties/[id]/comments`)

- [ ] `POST /api/properties/[id]/comments`: Visitor asks a question (`authorName`, `content`).
  - Generates `new_comment` activity notification for the agency.
- [ ] `POST /api/comments/[id]/reply`: Agency replies to a comment (`sellerReply`).

---

## [ ] 6. Visit Requests (`/api/visits` & `/api/properties/[id]/visits`)

- [ ] `POST /api/properties/[id]/visits`: Visitor requests a visit (`requesterName`, `requesterPhone`, `proposedDate`, `message`).
  - Validates proposed date is in the future.
  - Generates `new_visit` activity notification for the agency.
- [ ] `GET /api/agencies/me/visits`: Agency lists received visit requests.
- [ ] `PATCH /api/visits/[id]/status`: Agency updates visit status (`Confirmada`, `Rechazada`, `Realizada`, `Cancelada`).

---

## [ ] 7. Agency Reviews (`/api/agencies/[id]/reviews`)

- [ ] `POST /api/agencies/[id]/reviews`: Visitor posts a review (`authorName`, `content`, `rating` 1–5).
  - Generates `new_review` activity notification for the agency.
- [ ] `GET /api/agencies/[id]/reviews`: List reviews with total count and average score.

---

## [ ] 8. Activity Feed & Notifications (`/api/agencies/me/activities`)

- [ ] `GET /api/agencies/me/activities`: List feed events + unread count.
- [ ] `PATCH /api/agencies/me/activities/[id]/read`: Mark individual activity as read.
- [ ] `PATCH /api/agencies/me/activities/read-all`: Mark all activities as read.

---

## [ ] 9. Reports & Dashboard (`/api/agencies/me/reports`)

- [ ] `GET /api/agencies/me/reports`: Calculate dashboard metrics:
  - Property counts by status (`PUBLICADA`, `RESERVADA`, `VENDIDA`, `ALQUILADA`, `PAUSADA`, `CANCELADA`).
  - Monthly publications and closed sales/rentals.
  - Average time on market (days from `PUBLICADA` to `VENDIDA`/`ALQUILADA` using `property_state_history`).

---

## [ ] 10. Database Seed & Verification

- [ ] `src/db/seed.ts`: Seed database with realistic sample agencies, properties with images, comments, visits, and reviews.
- [ ] Verify `bun run typecheck` and `bun run lint`.
