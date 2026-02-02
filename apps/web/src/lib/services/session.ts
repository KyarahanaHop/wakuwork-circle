/**
 * Session Service
 *
 * Business logic for session management.
 * Handles join requests, approvals, and session queries.
 *
 * See: docs/ssot/flows.md, docs/ssot/domain-model.md
 */
import { prisma } from "@/lib/prisma";
import { JoinRequestStatus, SessionState } from "@/generated/prisma";
import { generateAnimalName } from "@/lib/utils/naming";

// =============================================================================
// Types
// =============================================================================

export interface SessionInfo {
  code: string;
  passphraseRequired: boolean;
  status: SessionState;
  streamerName: string;
  declaration: string | null;
  participantCount: number;
  pendingCount: number;
  startedAt: string;
  displayNameMode: string;
  roomName: string;
}

export interface JoinResult {
  success: boolean;
  requiresApproval: boolean;
  alreadyApproved: boolean;
  sessionCode: string;
  error?: string;
}

// =============================================================================
// Session Queries
// =============================================================================

/**
 * Get session by code
 */
export async function getSessionByCode(code: string) {
  return prisma.session.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      room: {
        include: {
          owner: true,
        },
      },
      members: true,
      joinRequests: {
        where: { status: "pending" },
      },
    },
  });
}

/**
 * Get session info for public display (without sensitive data)
 */
export async function getSessionInfo(
  code: string,
  userId?: string,
): Promise<SessionInfo | null> {
  const session = await getSessionByCode(code);
  if (!session) return null;

  // Get user's approval status if userId provided
  let userApprovalStatus: JoinRequestStatus | undefined;
  if (userId) {
    const joinRequest = await prisma.joinRequest.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId,
        },
      },
    });
    userApprovalStatus = joinRequest?.status;
  }

  return {
    code: session.code,
    passphraseRequired: session.passphraseRequired,
    status: session.state,
    streamerName: session.room.owner.discordName,
    declaration: session.declaration,
    participantCount: session.members.length,
    pendingCount: session.joinRequests.length,
    startedAt: session.startedAt.toISOString(),
    displayNameMode: session.room.displayNameMode,
    roomName: session.room.name,
  };
}

// =============================================================================
// Join Flow
// =============================================================================

/**
 * Process a join request
 *
 * Flow:
 * 1. Validate session exists
 * 2. Validate passphrase (if required)
 * 3. Check if user already approved
 * 4. Create join request (pending or auto-approve based on settings)
 */
export async function processJoinRequest(
  code: string,
  userId: string,
  passphrase?: string,
): Promise<JoinResult> {
  const session = await getSessionByCode(code);

  if (!session) {
    return {
      success: false,
      requiresApproval: false,
      alreadyApproved: false,
      sessionCode: code,
      error: "セッションが見つかりません",
    };
  }

  // Validate passphrase if required
  if (session.passphraseRequired) {
    // Edge case: passphraseRequired=true but passphrase is empty (config error)
    if (!session.passphrase) {
      return {
        success: false,
        requiresApproval: false,
        alreadyApproved: false,
        sessionCode: session.code,
        error: "合言葉が設定されていません。配信者に連絡してください。",
      };
    }
    if (passphrase !== session.passphrase) {
      return {
        success: false,
        requiresApproval: false,
        alreadyApproved: false,
        sessionCode: session.code,
        error: "合言葉が違います",
      };
    }
  }

  // Check if already a member
  const existingMember = await prisma.sessionMember.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId,
      },
    },
  });

  if (existingMember) {
    // Already approved member
    return {
      success: true,
      requiresApproval: false,
      alreadyApproved: true,
      sessionCode: session.code,
    };
  }

  // Check if already has a pending request
  const existingRequest = await prisma.joinRequest.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId,
      },
    },
  });

  if (existingRequest) {
    if (existingRequest.status === "approved") {
      return {
        success: true,
        requiresApproval: false,
        alreadyApproved: true,
        sessionCode: session.code,
      };
    }
    if (existingRequest.status === "pending") {
      return {
        success: true,
        requiresApproval: true,
        alreadyApproved: false,
        sessionCode: session.code,
      };
    }
    // Rejected - don't allow re-request in same session
    return {
      success: false,
      requiresApproval: false,
      alreadyApproved: false,
      sessionCode: session.code,
      error: "このセッションへの参加は拒否されています",
    };
  }

  // Check if this is the user's first visit to this room
  const previousVisits = await prisma.sessionMember.count({
    where: {
      userId,
      session: {
        roomId: session.roomId,
      },
    },
  });
  const isFirstVisit = previousVisits === 0;

  // Create join request
  // If approval not required AND not first visit, auto-approve
  const autoApprove = !session.room.approvalRequired && !isFirstVisit;

  await prisma.joinRequest.create({
    data: {
      sessionId: session.id,
      userId,
      status: autoApprove ? "approved" : "pending",
      isFirstVisit,
      resolvedAt: autoApprove ? new Date() : null,
    },
  });

  // If auto-approved, create member and presence event
  if (autoApprove) {
    await addMemberToSession(session.id, userId, session.room.displayNameMode);
  }

  return {
    success: true,
    requiresApproval: !autoApprove,
    alreadyApproved: autoApprove,
    sessionCode: session.code,
  };
}

// =============================================================================
// Approval Flow
// =============================================================================

/**
 * Approve a join request
 */
export async function approveJoinRequest(
  code: string,
  targetUserId: string,
  actorUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSessionByCode(code);
  if (!session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  // Verify actor is the room owner
  if (session.room.ownerId !== actorUserId) {
    return { success: false, error: "権限がありません" };
  }

  // Find pending request
  const request = await prisma.joinRequest.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId: targetUserId,
      },
    },
  });

  if (!request || request.status !== "pending") {
    return { success: false, error: "承認待ちのリクエストが見つかりません" };
  }

  // Update request status
  await prisma.joinRequest.update({
    where: { id: request.id },
    data: {
      status: "approved",
      resolvedAt: new Date(),
    },
  });

  // Add member
  await addMemberToSession(
    session.id,
    targetUserId,
    session.room.displayNameMode,
  );

  return { success: true };
}

/**
 * Reject a join request
 */
export async function rejectJoinRequest(
  code: string,
  targetUserId: string,
  actorUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSessionByCode(code);
  if (!session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  // Verify actor is the room owner
  if (session.room.ownerId !== actorUserId) {
    return { success: false, error: "権限がありません" };
  }

  // Find pending request
  const request = await prisma.joinRequest.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId: targetUserId,
      },
    },
  });

  if (!request || request.status !== "pending") {
    return { success: false, error: "承認待ちのリクエストが見つかりません" };
  }

  // Update request status
  await prisma.joinRequest.update({
    where: { id: request.id },
    data: {
      status: "rejected",
      resolvedAt: new Date(),
    },
  });

  return { success: true };
}

// =============================================================================
// Member Management
// =============================================================================

/**
 * Add a member to session with appropriate display name
 */
async function addMemberToSession(
  sessionId: string,
  userId: string,
  displayNameMode: string,
) {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate display name based on mode
  let displayName: string;
  switch (displayNameMode) {
    case "animal":
      displayName = generateAnimalName(userId, sessionId);
      break;
    case "anonymous":
      // Count existing members for number
      const memberCount = await prisma.sessionMember.count({
        where: { sessionId },
      });
      displayName = `参加者#${memberCount + 1}`;
      break;
    case "nickname":
    default:
      displayName = user.nickname || user.discordName;
      break;
  }

  // Create member
  await prisma.sessionMember.create({
    data: {
      sessionId,
      userId,
      displayName,
    },
  });

  // Create presence event
  await prisma.presenceEvent.create({
    data: {
      sessionId,
      userId,
      type: "enter",
    },
  });
}

/**
 * Get pending users for approval
 */
export async function getPendingUsers(code: string) {
  const session = await getSessionByCode(code);
  if (!session) return [];

  const requests = await prisma.joinRequest.findMany({
    where: {
      sessionId: session.id,
      status: "pending",
    },
    include: {
      user: true,
    },
    orderBy: {
      requestedAt: "asc",
    },
  });

  return requests.map((r) => ({
    id: r.userId,
    name: r.user.discordName,
    nickname: r.user.nickname,
    discordId: r.user.discordId,
    requestedAt: r.requestedAt.toISOString(),
    isFirstTime: r.isFirstVisit,
  }));
}

/**
 * Get session participants
 */
export async function getSessionParticipants(code: string) {
  const session = await getSessionByCode(code);
  if (!session) return [];

  const members = await prisma.sessionMember.findMany({
    where: { sessionId: session.id },
    include: {
      user: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  return members.map((m) => ({
    id: m.userId,
    name: m.displayName,
    discordName: m.user.discordName,
    discordId: m.user.discordId,
    category: m.category,
    shortText: m.shortText,
    isCompleted: m.isCompleted,
    isMuted: m.isMuted,
    joinedAt: m.joinedAt.toISOString(),
  }));
}

/**
 * Get user's approval status for a session
 */
export async function getUserApprovalStatus(
  code: string,
  userId: string,
): Promise<JoinRequestStatus | "member" | null> {
  const session = await getSessionByCode(code);
  if (!session) return null;

  // Check if already a member
  const member = await prisma.sessionMember.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId,
      },
    },
  });

  if (member) return "member";

  // Check join request status
  const request = await prisma.joinRequest.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId,
      },
    },
  });

  return request?.status ?? null;
}

// =============================================================================
// Member Status Updates
// =============================================================================

/**
 * Valid work categories (SSoT: flows.md Section 3.1)
 */
export const WORK_CATEGORIES = [
  "practice", // 練習
  "study", // 勉強
  "create", // 制作
  "work", // 作業
  "break", // 休憩
  "other", // その他
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];

/**
 * Update member's work status (category, shortText, isCompleted)
 *
 * See: docs/ssot/flows.md Section 3
 */
export async function updateMemberStatus(
  code: string,
  userId: string,
  updates: {
    category?: WorkCategory;
    shortText?: string;
    isCompleted?: boolean;
  },
): Promise<{ success: boolean; error?: string }> {
  const session = await getSessionByCode(code);

  if (!session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  if (session.state === "ended") {
    return { success: false, error: "終了したセッションは変更できません" };
  }

  // Find the member
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

  // Prepare update data
  const updateData: {
    category?: string;
    shortText?: string;
    isCompleted?: boolean;
  } = {};

  if (updates.category !== undefined) {
    if (!WORK_CATEGORIES.includes(updates.category)) {
      return { success: false, error: "無効なカテゴリです" };
    }
    updateData.category = updates.category;
  }

  if (updates.shortText !== undefined) {
    // Validate shortText length (max 50 chars)
    if (updates.shortText.length > 50) {
      return { success: false, error: "短文は50文字以内で入力してください" };
    }
    updateData.shortText = updates.shortText;
  }

  if (updates.isCompleted !== undefined) {
    updateData.isCompleted = updates.isCompleted;
  }

  // Update the member
  if (Object.keys(updateData).length > 0) {
    await prisma.sessionMember.update({
      where: { id: member.id },
      data: updateData,
    });
  }

  return { success: true };
}

/**
 * Get member's current status
 */
export async function getMemberStatus(
  code: string,
  userId: string,
): Promise<{
  category: string | null;
  shortText: string | null;
  isCompleted: boolean;
  displayName: string;
} | null> {
  const session = await getSessionByCode(code);

  if (!session) return null;

  const member = await prisma.sessionMember.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId,
      },
    },
  });

  if (!member) return null;

  return {
    category: member.category,
    shortText: member.shortText,
    isCompleted: member.isCompleted,
    displayName: member.displayName,
  };
}
