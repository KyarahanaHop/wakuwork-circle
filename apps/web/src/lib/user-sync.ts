/**
 * User Synchronization Helper
 *
 * Syncs Discord OAuth users to the database.
 * Called from API routes (not Edge runtime).
 *
 * See: docs/ssot/decisions.md D-006
 */
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

/**
 * Ensure user exists in database based on session
 * Returns the database user ID
 */
export async function ensureUser(session: Session): Promise<string> {
  if (!session.user?.discordId) {
    throw new Error("No Discord ID in session");
  }

  const user = await prisma.user.upsert({
    where: { discordId: session.user.discordId },
    update: {
      discordName: session.user.discordName || session.user.name || "Unknown",
    },
    create: {
      discordId: session.user.discordId,
      discordName: session.user.discordName || session.user.name || "Unknown",
      nickname: session.user.discordName || session.user.name || "Unknown",
    },
    select: { id: true },
  });

  return user.id;
}

/**
 * Get user from database by Discord ID
 */
export async function getUserByDiscordId(discordId: string) {
  return prisma.user.findUnique({
    where: { discordId },
  });
}

/**
 * Get user from database by internal ID
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}
