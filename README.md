# Habitat

A modern real estate web platform inspired by Zonaprop, developed as an academic project.

## Overview

Habitat is a full-featured real estate web application designed to streamline property discovery, listings management, and direct inquiries. The platform supports dedicated user roles, allowing individual clients and real estate agencies to browse, publish, and manage property portfolios seamlessly.

### Key Features

- **Multi-Role Authentication:** Specialized onboarding and role-based access for clients and agencies.
- **Property Search & Exploration:** Interactive filtering by location, price, property type, and amenities.
- **Listing Management:** Comprehensive CRUD operations for managing property portfolios.
- **Direct Inquiries:** Integrated lead contact and messaging channels for active listings.
- **Media Management:** Cloud-optimized image uploads and hosting for high-resolution galleries.

---

## Tech Stack

- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Framework:** [Next.js](https://nextjs.org/) (App Router, React, TypeScript)
- **Styling & UI Components:** [Tailwind CSS](https://tailwindcss.com/) with its own small component set (`src/components/ui`) and [lucide-react](https://lucide.dev/) icons
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** [Better Auth](https://www.better-auth.com/)
- **Media Storage:** [Uploadthing](https://uploadthing.com/) / [Cloudinary](https://cloudinary.com/)
- **Code Quality & CI:** [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Husky](https://typicode.github.io/husky/), [Commitlint](https://commitlint.js.org/), and GitHub Actions

---

## Architecture

Next.js maps files to URLs, but it does not give the app any structure beyond
that. To keep the layers explicit, every request goes through the same four
layers, each one in its own folder:

```text
route.ts ──▶ controller ──▶ service ──▶ repository ──▶ model
 (URL)        (HTTP)        (rules)     (read/write)   (entities)
```

| Layer          | Folder             | Its job                                                                                                                                | It must NOT                                     |
| -------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Route**      | `src/app/api/**`   | Next.js file-system routing: maps a URL + HTTP method to a controller action. One or two lines per file.                               | contain any logic                               |
| **Controller** | `src/controllers`  | HTTP only: read params/query/body, validate them with Zod, find out who is calling (session), call **one** service, shape the response | touch the database or enforce business rules    |
| **Service**    | `src/services`     | Business rules: ownership, the property/visit state machines, transactions, notifications. Receives plain data, throws domain errors   | know about `Request`/`Response`, Next.js or SQL |
| **Repository** | `src/repositories` | Data access: Drizzle queries that read and write. Takes an optional transaction as last argument                                       | decide anything (no rules), call services       |
| **Model**      | `src/models`       | The entities: Drizzle tables, enums, relations and the inferred TypeScript types. Source of truth for migrations                       | depend on any other layer                       |

Supporting folders: `src/lib` (auth helpers, domain errors, pagination, the Zod
input schemas in `lib/validations`) and `src/db` (connection, migrations, seed).

The boundaries are enforced by ESLint (`no-restricted-imports` in
`eslint.config.mjs`): a controller importing a repository, or a service
importing Drizzle or `next/server`, fails `bun run lint`.

**Errors** are thrown by services as plain domain errors (`NotFoundError`,
`ForbiddenError`, `ConflictError`, `ValidationError`) and translated to a status
code in a single place, `src/controllers/http.ts`.

### Anatomy of a request: `PATCH /api/properties/:id/status`

1. `src/app/api/properties/[id]/status/route.ts` → `propertyController.changeStatus`
2. **Controller** reads `:id`, gets the agency from the session, validates the body with `updatePropertyStatusSchema`, calls `propertyService.changeStatus(agencyId, id, status)` and answers `200 { data }`.
3. **Service** checks the property belongs to that agency (403), that the transition is allowed by the state machine (400), then in one transaction updates the status, appends to the state history and creates the activity.
4. **Repository** functions (`propertyRepository.updateStatus`, `stateHistoryRepository.create`, `activityRepository.create`) run the queries.
5. **Model** (`src/models/property.model.ts`) is what those queries are written against.

---

## API

Success responses are `{ data }`; paginated ones are `{ data: [...], meta: { total, page, limit, totalPages } }`.
Errors are `{ error, details? }` with `400` validation (including a property state change the state machine doesn't allow) · `401` no session · `403` not yours · `404` · `409` conflict with the current state (edit of a closed property, a second reply, a visit already answered, someone changed it first).
`page` starts at 1 and `limit` is capped at 50.

### Public

One endpoint per filter, plus two combos for the searches that repeat the most.
All of them list only `PUBLICADA` properties and accept `?page=&limit=&sort=`
(`date_desc` · `date_asc` · `price_asc` · `price_desc` · `area_desc` · `area_asc`).

| Endpoint                                                              | Filter                                        |
| --------------------------------------------------------------------- | --------------------------------------------- |
| `GET /api/properties`                                                 | none, or **any combination** (see below)      |
| `GET /api/properties/type/:type`                                      | `Casa` · `Departamento` · `Terreno` · `Local` |
| `GET /api/properties/operation/:operation`                            | `Venta` · `Alquiler`                          |
| `GET /api/properties/neighborhood/:neighborhood`                      | zone, contains, case-insensitive              |
| `GET /api/properties/price?currency=&min=&max=`                       | price range in one currency                   |
| `GET /api/properties/rooms/:min` · `bedrooms/:min` · `bathrooms/:min` | N or more                                     |
| `GET /api/properties/tags?tag=pileta&tag=cochera`                     | has all the tags                              |
| `GET /api/properties/search?q=`                                       | free text in title / description              |
| `GET /api/agencies/:id/properties`                                    | one agency's listings                         |
| `GET /api/properties/type/:type/operation/:operation`                 | **combo:** "casas en venta"                   |
| `GET /api/properties/type/:type/operation/:operation/neighborhood/:n` | **combo:** "casas en venta en Palermo"        |

`GET /api/properties` is what the Home page calls: besides `?page=&limit=&sort=` it
accepts every filter at once, all optional (an empty value means "no filter"):
`type`, `operation`, `q`, `neighborhood`, `currency` + `minPrice`/`maxPrice`
(a range needs its currency), `rooms` (N or more) and `tag` (repeatable, has all).
A `400` explains what is wrong, e.g. `?minPrice=100` without `currency`.

Adding another combo later is one `route.ts` + one controller action + one
service function: the query itself is already built once in
`propertyRepository.search`.

| Endpoint                            | What                                                                 |
| ----------------------------------- | -------------------------------------------------------------------- |
| `GET /api/health`                   | `200 { status: "ok" }` when the app and its database answer          |
| `GET /api/properties/:id`           | Full detail: gallery, agency, comments (drafts only for their owner) |
| `GET /api/properties/:id/comments`  | The questions of a property (paginated, with their replies)          |
| `POST /api/properties/:id/comments` | Ask a question `{ authorName, content }`                             |
| `POST /api/properties/:id/visits`   | Request a visit `{ requesterName, requesterPhone, proposedDate }`    |
| `GET /api/agencies/:id`             | Public agency page: contact, rating, latest listings and reviews     |
| `GET /api/agencies/:id/reviews`     | Reviews + total + average rating                                     |
| `POST /api/agencies/:id/reviews`    | Leave a review `{ authorName, content, rating 1-5 }`                 |
| `POST /api/auth/register-seller`    | Create user + agency in one step                                     |
| `POST /api/auth/sign-in/email` …    | Better Auth (`/api/auth/*`)                                          |

### Seller (needs a session)

| Endpoint                                                       | What                                                                                               |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GET` · `PATCH` · `DELETE /api/agencies/me`                    | Own profile (`email` is the **public** contact email); delete only without `PUBLICADA`/`RESERVADA` |
| `GET /api/agencies/me/properties?status=`                      | "Mis propiedades": every status                                                                    |
| `POST /api/properties`                                         | Create (starts `BORRADOR` or `PUBLICADA`)                                                          |
| `PATCH /api/properties/:id`                                    | Edit (blocked if closed or with `Confirmada` visits)                                               |
| `PATCH /api/properties/:id/status`                             | State machine: logs history + creates activity                                                     |
| `GET /api/properties/:id/status-history`                       | The audit log of a property, oldest first                                                          |
| `POST /api/properties/:id/images` · `DELETE …/images/:imageId` | Gallery                                                                                            |
| `PATCH /api/properties/:id/images/:imageId/cover`              | Set cover                                                                                          |
| `PUT /api/properties/:id/images/order`                         | Reorder the gallery `{ imageIds }` (must list every image once)                                    |
| `GET /api/agencies/me/comments?unanswered=true`                | "Consultas" + count of unanswered                                                                  |
| `POST /api/comments/:id/reply`                                 | Single reply `{ sellerReply }`                                                                     |
| `GET /api/agencies/me/visits?status=`                          | Received visit requests                                                                            |
| `PATCH /api/visits/:id/status`                                 | `Confirmada` · `Rechazada` · `Realizada` · `Cancelada`                                             |
| `GET /api/agencies/me/activities?unread=true`                  | Feed + `meta.unreadCount`; each entry says where it came from (`propertyId`, `referenceId`)        |
| `GET /api/agencies/me/activities/unread-count`                 | Just the number, for the badge in the navigation                                                   |
| `PATCH /api/agencies/me/activities/:id/read` · `…/read-all`    | Mark as read                                                                                       |
| `GET /api/agencies/me/reports/status-summary`                  | Properties per current state                                                                       |
| `GET /api/agencies/me/reports/monthly`                         | New publications and closed sales/rentals, last 12 months                                          |
| `GET /api/agencies/me/reports/avg-time-on-market`              | Average days between `PUBLICADA` and `VENDIDA`/`ALQUILADA` (`null` if none)                        |
| `GET /api/agencies/me/reports`                                 | The three indicators together                                                                      |

Every endpoint is in [`api.http`](api.http), ready to run (see [Trying the API](#trying-the-api)).

---

## Frontend

Next.js (App Router) + Tailwind, rendered in the browser over the API above. Files and folders are named in
English; the Spanish URLs below are `rewrites` in `next.config.ts`.

### The visitor (no account)

| URL                  | Screen                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | Listing: free-text search, combined filters, sorting and pagination. **All of it lives in the URL query**                  |
| `/propiedades/:id`   | Detail: gallery, attributes, questions with their replies, "ask" form, "request a visit" dialog, link to the seller's site |
| `/inmobiliarias/:id` | Seller's site: contact data (clickable phone), rating, published properties, reviews and the "leave a review" form         |

### The seller (needs a session)

| URL                             | Screen                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/registro` · `/login`          | One-step sign-up (account + agency) and login. `?next=` brings the seller back to where they were going  |
| `/panel/propiedades`            | "Mis propiedades": only the lifecycle buttons that are valid, confirmation before closing, state history |
| `/panel/propiedades/nueva`      | Create a property (fields that don't apply to a Terreno disappear)                                       |
| `/panel/propiedades/:id/editar` | Edit (preloaded) and manage the gallery: upload, order, cover, delete                                    |
| `/panel/visitas`                | Received visit requests, grouped by property: confirm / reject / done / cancel                           |
| `/panel/consultas`              | Received questions, grouped by property, answered inline                                                 |
| `/panel/actividad`              | Feed of news; the unread counter in the navigation is polled and stops when the panel is left            |
| `/panel/reportes`               | Three independent indicators: by state, per month (bars) and average time on the market                  |
| `/panel/inmobiliaria`           | Edit the agency's public data, or delete it (the API's 409 reason is shown)                              |

Everything under `/panel` is behind a session guard. It only exists for the experience: whoever protects the
data is the API (401 without a session; the panel then clears the session and goes to the login).

```text
src/app/**/page.tsx        pages: thin, they only hand over the route params
src/components/ui/         reusable pieces: Button, Fields (label + error per field), States (loading /
                           empty / error), Dialog + ConfirmDialog, Pagination, StarRating, RemoteImage
src/components/<domain>/   properties, agencies, comments, visits, auth and panel/* (one folder per screen)
src/hooks/                 logic out of the components: useFetch (AbortController), useAction, useForm,
                           useDebouncedFields, usePolling, useAuth, usePropertyFilters, useProperties...
src/lib/api/               the ONLY place that knows the API: client.ts (envelopes, errors, 401) and one
                           module per resource (properties, agencies, inquiries, visits, activities, reports)
src/lib/                   property-filters (URL <-> filters <-> API query), property-lifecycle (the state
                           machine, shared with the API), format, property-options
```

Styling is Tailwind CSS everywhere (one accent colour in `tailwind.config.ts`).

---

## Repository Structure

```text
habitat/
├── .github/workflows/ci.yml         # CI: lint, format check, typecheck
├── .husky/                          # Git hooks (pre-commit, commit-msg)
├── drizzle.config.ts                # Drizzle Kit (reads src/models, writes src/db/migrations)
├── eslint.config.mjs                # Lint rules, including the layer boundaries
├── src/
│   ├── app/api/**/route.ts          # ROUTE: URL -> controller action
│   ├── controllers/                 # CONTROLLER: HTTP, validation, responses (+ http.ts: error handler)
│   ├── services/                    # SERVICE: business rules and transactions
│   ├── repositories/                # REPOSITORY: Drizzle queries
│   ├── models/                      # MODEL: tables, enums, relations, types
│   ├── lib/                         # auth, errors, pagination, validations/ (Zod input schemas)
│   └── db/                          # connection, migrations/, seed.ts
├── tests/                           # Integration tests (bun test, isolated habitat_test database)
├── api.http                         # Every endpoint, ready to run (REST Client / JetBrains)
├── package.json                     # Dependencies and scripts
└── README.md
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.1.0 or higher recommended)
- A running [PostgreSQL](https://www.postgresql.org/) 16+ instance (Local, Docker, Neon, or Supabase) with an empty database for the app (e.g. `createdb habitat`)

### Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/LukenPaluken/habitat.git
   cd habitat
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Configure the environment:** copy `.env.example` to `.env` and set `DATABASE_URL` (and the Better Auth / UploadThing values).

4. **Create the tables and load demo data:**

   ```bash
   bun run db:migrate   # applies src/db/migrations
   bun run db:seed      # 3 agencies, 14 properties, comments, visits, reviews (add -- --reset to wipe first)
   ```

   The seeded sellers (e.g. `lucia@inmobiliariadelsol.com`) all use the password `habitat123`.

5. **Run it:**

   ```bash
   bun run dev
   ```

Other scripts: `bun run lint` · `bun run typecheck` · `bun run test` · `bun run build` · `bun run db:generate` (after changing a file in `src/models`) · `bun run db:studio`.

Open <http://localhost:3000>. `GET /api/health` answers `{ "status": "ok" }` when the app can reach the database.

### Tests

```bash
bun test
```

They are integration tests of the business rules (registration, the property state machine, price and surface
validation, combined search, visits, comments, reviews, activity, reports, gallery). They run against their own
database, `habitat_test`, which is **created and migrated automatically** on the PostgreSQL of `DATABASE_URL`'s
server (override with `TEST_DATABASE_URL`; its name must end in `_test`: nothing else is accepted). Every test
builds the data it needs, so they pass in any order.

### Trying the API

Open [`api.http`](api.http) with the _REST Client_ extension (or a JetBrains IDE), run **login** once and then
any request top to bottom: the ids each one needs are taken from the answers of the previous ones.

### Demo script

1. **Visitor.** On `/` search "vista", filter _Departamento_ + _Alquiler_, change the order, go to page 2 and copy
   the URL: opened in another tab it shows the same results. Open a property: swap photos, read a question and its
   reply, ask a new one (it appears at once) and **Pedir una visita**. From there open the seller's site, read the
   reviews and leave one: the average updates without reloading.
2. **Seller.** **Ingresar como vendedor** with `lucia@inmobiliariadelsol.com` / `habitat123`. In _Visitas_ confirm
   one (it changes in place; the phone is clickable). In _Consultas_ answer a question and check it in the public
   detail. In _Actividad_ mark one as read: the badge goes down. In _Mis propiedades_ publish the draft, try
   _Dar de baja_ (it asks first) and open _Historial_. Create a _Terreno_ (note which fields disappear) and add
   photos by URL in its edit page. Finish in _Reportes_.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
