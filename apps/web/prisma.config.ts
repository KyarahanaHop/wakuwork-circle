/**
 * Prisma Configuration
 *
 * Uses DIRECT_URL for CLI operations (migrations, introspection)
 * Database URL uses Supabase Transaction Pooler for better serverless performance
 *
 * See: docs/ssot/decisions.md D-006
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct connection for CLI (migrations), pooled for runtime
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
