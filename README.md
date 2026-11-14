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
- **Styling & UI Components:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
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
3. **Service** checks the property belongs to that agency (403), that the transition is allowed by the state machine (409), then in one transaction updates the status, appends to the state history and creates the activity.
4. **Repository** functions (`propertyRepository.updateStatus`, `stateHistoryRepository.create`, `activityRepository.create`) run the queries.
5. **Model** (`src/models/property.model.ts`) is what those queries are written against.

---

## API

Success responses are `{ data }`; paginated ones are `{ data: [...], meta: { total, page, limit, totalPages } }`.
Errors are `{ error, details? }` with `400` validation · `401` no session · `403` not yours · `404` · `409` rule/state conflict.
`page` starts at 1 and `limit` is capped at 50.

### Public

One endpoint per filter, plus two combos for the searches that repeat the most.
All of them list only `PUBLICADA` properties and accept `?page=&limit=&sort=`
(`date_desc` · `date_asc` · `price_asc` · `price_desc` · `area_desc` · `area_asc`).

| Endpoint                                                              | Filter                                        |
| --------------------------------------------------------------------- | --------------------------------------------- |
| `GET /api/properties`                                                 | none (everything published)                   |
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

Adding another combo later is one `route.ts` + one controller action + one
service function: the query itself is already built once in
`propertyRepository.search`.

| Endpoint                            | What                                                                 |
| ----------------------------------- | -------------------------------------------------------------------- |
| `GET /api/properties/:id`           | Full detail: gallery, agency, comments (drafts only for their owner) |
| `POST /api/properties/:id/comments` | Ask a question `{ authorName, content }`                             |
| `POST /api/properties/:id/visits`   | Request a visit `{ requesterName, requesterPhone, proposedDate }`    |
| `GET /api/agencies/:id`             | Public agency page: contact, rating, latest listings and reviews     |
| `GET /api/agencies/:id/reviews`     | Reviews + total + average rating                                     |
| `POST /api/agencies/:id/reviews`    | Leave a review `{ authorName, content, rating 1-5 }`                 |
| `POST /api/auth/register-seller`    | Create user + agency in one step                                     |
| `POST /api/auth/sign-in/email` …    | Better Auth (`/api/auth/*`)                                          |

### Seller (needs a session)

| Endpoint                                                       | What                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| `GET` · `PATCH` · `DELETE /api/agencies/me`                    | Own profile; delete only without `PUBLICADA`/`RESERVADA` |
| `GET /api/agencies/me/properties?status=`                      | "Mis propiedades": every status                          |
| `POST /api/properties`                                         | Create (starts `BORRADOR` or `PUBLICADA`)                |
| `PATCH /api/properties/:id`                                    | Edit (blocked if closed or with `Confirmada` visits)     |
| `PATCH /api/properties/:id/status`                             | State machine: logs history + creates activity           |
| `POST /api/properties/:id/images` · `DELETE …/images/:imageId` | Gallery                                                  |
| `PATCH /api/properties/:id/images/:imageId/cover`              | Set cover                                                |
| `GET /api/agencies/me/comments?unanswered=true`                | "Consultas" + count of unanswered                        |
| `POST /api/comments/:id/reply`                                 | Single reply `{ sellerReply }`                           |
| `GET /api/agencies/me/visits?status=`                          | Received visit requests                                  |
| `PATCH /api/visits/:id/status`                                 | `Confirmada` · `Rechazada` · `Realizada` · `Cancelada`   |
| `GET /api/agencies/me/activities?unread=true`                  | Feed + `meta.unreadCount`                                |
| `PATCH /api/agencies/me/activities/:id/read` · `…/read-all`    | Mark as read                                             |
| `GET /api/agencies/me/reports`                                 | Dashboard: by status, per month, average days on market  |

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
├── package.json                     # Dependencies and scripts
└── README.md
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.1.0 or higher recommended)
- A running [PostgreSQL](https://www.postgresql.org/) instance (Local, Neon, or Supabase)

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

Other scripts: `bun run lint` · `bun run typecheck` · `bun run db:generate` (after changing a file in `src/models`) · `bun run db:studio`.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
