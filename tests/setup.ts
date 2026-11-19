// Runs once before the tests: points the app at a separate database, creates it
// if it doesn't exist and brings it to the latest migration. Nothing here can
// touch the development database.
import postgres from "postgres";

const url =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/habitat_test";
const databaseName = new URL(url).pathname.slice(1);

// A typo in an env var must never wipe real data: tests only run on `*_test`.
if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Refusing to run the tests on "${databaseName}": the test database name must end with "_test".`
  );
}

const admin = postgres(new URL("/postgres", url).toString(), {
  max: 1,
  onnotice: () => {}, // e.g. a collation-version warning of the local server
});
const found =
  await admin`select 1 from pg_database where datname = ${databaseName}`;
if (found.length === 0) {
  await admin.unsafe(`create database "${databaseName}" template template0`);
}
await admin.end();

// `@/db` reads DATABASE_URL when it is first imported, so set it before that.
process.env.DATABASE_URL = url;

// Migrating with its own connection keeps the "already exists, skipping"
// notices of every run out of the test output.
const { drizzle } = await import("drizzle-orm/postgres-js");
const { migrate } = await import("drizzle-orm/postgres-js/migrator");
const migrator = postgres(url, { max: 1, onnotice: () => {} });
await migrate(drizzle(migrator), { migrationsFolder: "./src/db/migrations" });
await migrator.end();
