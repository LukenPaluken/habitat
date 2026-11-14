import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Layer boundaries (see "Architecture" in the README). A layer may only import
// from the layer right below it, so the flow is always:
//   route.ts -> controller -> service -> repository -> model
const forbid = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const layer = (group, message) => ({ group, message });

const noDrizzle = layer(
  ["drizzle-orm", "drizzle-orm/*", "@/db", "@/db/*"],
  "Only repositories (and the model) talk to the database."
);
const noNext = layer(
  ["next", "next/*"],
  "Only controllers and route.ts know about HTTP / Next.js."
);
const noRepositories = layer(
  ["@/repositories/*"],
  "Go through a service: it owns the business rules."
);
const noServices = layer(
  ["@/services/*"],
  "Services sit below controllers; calling them from here skips a layer."
);
const noControllers = layer(
  ["@/controllers/*"],
  "Controllers are the top layer; nothing below may depend on them."
);

const eslintConfig = [
  {
    ignores: [".next/*"],
  },
  ...compat.extends("next/core-web-vitals", "prettier"),

  // route.ts: only maps URLs to controllers.
  {
    files: ["src/app/api/**/route.ts"],
    rules: forbid(
      layer(
        ["@/services/*", "@/repositories/*", "@/models", "@/models/*"],
        "route.ts only maps a URL to a controller action."
      ),
      noDrizzle
    ),
  },
  // controller: HTTP in/out + validation. No database, no repositories.
  {
    files: ["src/controllers/**/*.ts"],
    rules: forbid(
      noDrizzle,
      layer(
        ["@/repositories/*", "@/models", "@/models/*"],
        "Controllers call services; data access belongs to repositories."
      )
    ),
  },
  // service: business rules. No HTTP, no SQL.
  {
    files: ["src/services/**/*.ts"],
    rules: forbid(noDrizzle, noNext, noControllers),
  },
  // repository: reads and writes only. No rules, no HTTP.
  {
    files: ["src/repositories/**/*.ts"],
    rules: forbid(noNext, noServices, noControllers),
  },
  // model: entity definitions. Depends on nothing else of the app.
  {
    files: ["src/models/**/*.ts"],
    rules: forbid(
      noNext,
      noServices,
      noControllers,
      noRepositories,
      layer(["@/db", "@/db/*"], "The model is below the db client.")
    ),
  },
];

export default eslintConfig;
