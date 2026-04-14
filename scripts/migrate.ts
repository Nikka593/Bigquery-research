import { runMigrations } from "../lib/db/migrate";

const dbPath = process.env.DB_PATH ?? "./data/app.db";
runMigrations(dbPath);
console.log(`[migrate] applied schema -> ${dbPath}`);
