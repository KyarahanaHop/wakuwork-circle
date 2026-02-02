/**
 * Prisma Client Singleton for Next.js
 *
 * Prevents multiple Prisma Client instances in development (HMR)
 * Uses driver adapter for Supabase connection pooling
 *
 * See: docs/ssot/decisions.md D-006
 */
import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// Global store for singleton pattern (HMR resilient)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with pg adapter for Supabase pooling
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Export singleton instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Store in global for development HMR
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
