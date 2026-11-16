import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/models/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/habitat",
  },
  verbose: true,
  strict: true,
});
