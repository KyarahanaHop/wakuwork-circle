/**
 * Stamp Service
 *
 * Business logic for stamp (reaction) management.
 * Handles sending stamps with rate limiting and retrieving recent stamps.
 *
 * See: docs/ssot/flows.md Section 4
 */
import { prisma } from "@/lib/prisma";

// =============================================================================
// Types & Constants
// =============================================================================

/**
 * Valid stamp types (SSoT: flows.md Section 4.1)
 */
export const STAMP_TYPES = ["wave", "like", "alert", "sleepy"] as const;
export type StampType = (typeof STAMP_TYPES)[number];

/**
 * Rate limit configuration (SSoT: flows.md Section 4.2)
 */
const RATE_LIMIT = {
  maxPerMinute: 10, // Maximum stamps per minute
  minIntervalMs: 2000, // Minimum interval between stamps (2 seconds)
  windowMs: 60000, // Rate limit window (1 minute)
};

/**
 * Stamp display configuration
 */
const STAMP_DISPLAY = {
  maxAgeSeconds: 10, // Only return stamps from last 10 seconds
};

export interface StampResult {
  success: boolean;
  error?: string;
  stampId?: string;
}

export interface RecentStamp {
  id: string;
  stampType: StampType;
  displayName: string;
  createdAt: string;
}

// =============================================================================
// Stamp Operations
// =============================================================================

/**
 * Send a stamp to a session
 *
 * Rate limits:
 * - Max 10 stamps per minute per user
 * - Min 2 seconds between stamps
 */
export async function sendStamp(
  sessionCode: string,
  userId: string,
  stampType: string,
): Promise<StampResult> {
  // Validate stamp type
  if (!STAMP_TYPES.includes(stampType as StampType)) {
    return { success: false, error: "無効なスタンプタイプです" };
  }

  // Get session
  const session = await prisma.session.findUnique({
    where: { code: sessionCode.toUpperCase() },
  });

  if (!session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  if (session.state === "ended") {
    return {
      success: false,
      error: "終了したセッションにはスタンプを送れません",
    };
  }

  // Check if user is a member of the session
  const member = await prisma.sessionMember.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId,
      },
    },
  });

  if (!member) {
    return { success: false, error: "セッションに参加していません" };
  }

  // Check if user is muted
  if (member.isMuted) {
    const now = new Date();
    if (!member.muteExpiresAt || member.muteExpiresAt > now) {
      return { success: false, error: "ミュートされています" };
    }
  }

  // Rate limit check
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT.windowMs);
  const minIntervalStart = new Date(now.getTime() - RATE_LIMIT.minIntervalMs);

  // Check stamps in the last minute
  const recentStamps = await prisma.stampEvent.findMany({
    where: {
      sessionId: session.id,
      userId,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check max per minute
  if (recentStamps.length >= RATE_LIMIT.maxPerMinute) {
    return {
      success: false,
      error: `1分間に${RATE_LIMIT.maxPerMinute}回までしかスタンプを送れません`,
    };
  }

  // Check min interval (last stamp must be at least 2 seconds ago)
  if (recentStamps.length > 0) {
    const lastStamp = recentStamps[0];
    if (lastStamp.createdAt >= minIntervalStart) {
      return {
        success: false,
        error: "スタンプの送信間隔が短すぎます（2秒以上空けてください）",
      };
    }
  }

  // Create stamp event
  const stamp = await prisma.stampEvent.create({
    data: {
      sessionId: session.id,
      userId,
      stampType,
    },
  });

  return { success: true, stampId: stamp.id };
}

/**
 * Get recent stamps for a session (for polling)
 *
 * Returns stamps from the last 10 seconds
 * Uses createdAt as cursor (not id) since cuid is not monotonically increasing
 *
 * @param sinceTimestamp - ISO timestamp string to get stamps after (exclusive)
 */
export async function getRecentStamps(
  sessionCode: string,
  sinceTimestamp?: string,
): Promise<RecentStamp[]> {
  const session = await prisma.session.findUnique({
    where: { code: sessionCode.toUpperCase() },
  });

  if (!session) return [];

  const now = new Date();
  const maxAge = new Date(now.getTime() - STAMP_DISPLAY.maxAgeSeconds * 1000);

  // Determine the effective start time
  // Use the later of: maxAge or sinceTimestamp
  let effectiveStart = maxAge;
  if (sinceTimestamp) {
    const sinceDate = new Date(sinceTimestamp);
    if (sinceDate > maxAge) {
      effectiveStart = sinceDate;
    }
  }

  const stamps = await prisma.stampEvent.findMany({
    where: {
      sessionId: session.id,
      createdAt: { gt: effectiveStart }, // gt (not gte) to avoid duplicates
    },
    include: {
      user: true,
    },
    orderBy: { createdAt: "asc" },
    take: 50, // Limit to prevent abuse
  });

  // Get display names from session members
  const memberMap = new Map<string, string>();
  const members = await prisma.sessionMember.findMany({
    where: { sessionId: session.id },
  });
  members.forEach((m) => memberMap.set(m.userId, m.displayName));

  return stamps.map((s) => ({
    id: s.id,
    stampType: s.stampType as StampType,
    displayName: memberMap.get(s.userId) || "Unknown",
    createdAt: s.createdAt.toISOString(),
  }));
}

/**
 * Clean up old stamps (can be called periodically)
 * Deletes stamps older than 1 minute
 */
export async function cleanupOldStamps(): Promise<number> {
  const cutoff = new Date(Date.now() - 60000); // 1 minute ago

  const result = await prisma.stampEvent.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });

  return result.count;
}
