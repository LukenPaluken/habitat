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

## Repository Structure

```text
habitat/
├── .github/
│   └── workflows/
│       └── ci.yml                   # Automated CI workflow (lint, format, typecheck)
├── .husky/                          # Git hooks (pre-commit, commit-msg)
├── .commitlintrc.json               # Commitlint rules config
├── .gitignore                       # Git ignore list
├── .prettierrc                      # Prettier code formatting rules
├── LICENSE                          # MIT License
├── package.json                     # Dependencies, scripts and lint-staged config
└── README.md                        # Documentation and project guide
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

_(Note: Database sync, environment variables, and local development server instructions will be added to this section once the application structure is fully initialized.)_

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
