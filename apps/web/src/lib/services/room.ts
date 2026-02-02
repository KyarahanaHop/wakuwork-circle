/**
 * Room Service
 *
 * Business logic for room and session management (streamer operations).
 * Handles room CRUD, session lifecycle, and settings updates.
 *
 * See: docs/ssot/domain-model.md, docs/ssot/decisions.md (A-005, D-011)
 */
import { prisma } from "@/lib/prisma";
import { DisplayNameMode, SessionState } from "@/generated/prisma";
import { generateSessionCode } from "@/lib/utils/naming";

// =============================================================================
// Types
// =============================================================================

export interface CreateRoomInput {
  name: string;
  displayNameMode?: DisplayNameMode;
  approvalRequired?: boolean;
}

export interface CreateSessionInput {
  roomId: string;
  passphrase: string;
  passphraseRequired?: boolean;
  declaration?: string;
}

export interface UpdateSessionSettingsInput {
  passphrase?: string;
  passphraseRequired?: boolean;
  approvalRequired?: boolean; // Room-level setting
  declaration?: string;
  state?: SessionState;
}

export interface RoomWithActiveSession {
  id: string;
  name: string;
  displayNameMode: DisplayNameMode;
  approvalRequired: boolean;
  activeSession: {
    id: string;
    code: string;
    passphrase: string;
    passphraseRequired: boolean;
    state: SessionState;
    declaration: string | null;
    startedAt: Date;
    memberCount: number;
    pendingCount: number;
  } | null;
}

// =============================================================================
// Room Operations
// =============================================================================

/**
 * Get streamer's room (MVP: 1 streamer = 1 room)
 * Returns room with active session if exists
 */
export async function getStreamerRoom(
  userId: string,
): Promise<RoomWithActiveSession | null> {
  const room = await prisma.room.findFirst({
    where: { ownerId: userId },
    include: {
      sessions: {
        where: {
          state: { not: "ended" },
        },
        include: {
          members: true,
          joinRequests: {
            where: { status: "pending" },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!room) return null;

  const activeSession = room.sessions[0] ?? null;

  return {
    id: room.id,
    name: room.name,
    displayNameMode: room.displayNameMode,
    approvalRequired: room.approvalRequired,
    activeSession: activeSession
      ? {
          id: activeSession.id,
          code: activeSession.code,
          passphrase: activeSession.passphrase,
          passphraseRequired: activeSession.passphraseRequired,
          state: activeSession.state,
          declaration: activeSession.declaration,
          startedAt: activeSession.startedAt,
          memberCount: activeSession.members.length,
          pendingCount: activeSession.joinRequests.length,
        }
      : null,
  };
}

/**
 * Create a new room for streamer
 * MVP: 1 streamer = 1 room (A-005)
 */
export async function createRoom(
  userId: string,
  input: CreateRoomInput,
): Promise<{ success: boolean; roomId?: string; error?: string }> {
  // Check if user already has a room (MVP: 1 room limit)
  const existingRoom = await prisma.room.findFirst({
    where: { ownerId: userId },
  });

  if (existingRoom) {
    return {
      success: false,
      error: "既にルームが存在します。MVPでは1配信者1ルームの制限があります。",
    };
  }

  const room = await prisma.room.create({
    data: {
      ownerId: userId,
      name: input.name,
      displayNameMode: input.displayNameMode ?? "nickname",
      approvalRequired: input.approvalRequired ?? true,
    },
  });

  return { success: true, roomId: room.id };
}

/**
 * Update room settings
 */
export async function updateRoomSettings(
  roomId: string,
  userId: string,
  settings: { displayNameMode?: DisplayNameMode; approvalRequired?: boolean },
): Promise<{ success: boolean; error?: string }> {
  // Verify ownership
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    return { success: false, error: "ルームが見つかりません" };
  }

  if (room.ownerId !== userId) {
    return { success: false, error: "権限がありません" };
  }

  await prisma.room.update({
    where: { id: roomId },
    data: settings,
  });

  return { success: true };
}

// =============================================================================
// Session Lifecycle
// =============================================================================

/**
 * Start a new session in a room
 * - Generates unique session code automatically
 * - Previous sessions are auto-ended if any active
 */
export async function startSession(
  userId: string,
  input: CreateSessionInput,
): Promise<{ success: boolean; sessionCode?: string; error?: string }> {
  // Verify room ownership
  const room = await prisma.room.findUnique({
    where: { id: input.roomId },
  });

  if (!room) {
    return { success: false, error: "ルームが見つかりません" };
  }

  if (room.ownerId !== userId) {
    return { success: false, error: "権限がありません" };
  }

  // End any active sessions first
  await prisma.session.updateMany({
    where: {
      roomId: input.roomId,
      state: { not: "ended" },
    },
    data: {
      state: "ended",
      endedAt: new Date(),
    },
  });

  // Generate unique session code
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateSessionCode();
    const existing = await prisma.session.findUnique({
      where: { code },
    });
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    return {
      success: false,
      error: "セッションコードの生成に失敗しました。再試行してください。",
    };
  }

  // Create new session
  const session = await prisma.session.create({
    data: {
      roomId: input.roomId,
      code,
      passphrase: input.passphrase,
      passphraseRequired: input.passphraseRequired ?? true,
      declaration: input.declaration,
      state: "working",
    },
  });

  return { success: true, sessionCode: session.code };
}

/**
 * End a session
 */
export async function endSession(
  sessionCode: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await prisma.session.findUnique({
    where: { code: sessionCode.toUpperCase() },
    include: { room: true },
  });

  if (!session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  if (session.room.ownerId !== userId) {
    return { success: false, error: "権限がありません" };
  }

  if (session.state === "ended") {
    return { success: false, error: "このセッションは既に終了しています" };
  }

  await prisma.session.update({
    where: { id: session.id },
    data: {
      state: "ended",
      endedAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Update session settings
 * Handles: passphrase, passphraseRequired, declaration, state
 * Also handles approvalRequired (room-level) for convenience
 */
export async function updateSessionSettings(
  sessionCode: string,
  userId: string,
  input: UpdateSessionSettingsInput,
): Promise<{ success: boolean; error?: string; warning?: string }> {
  const session = await prisma.session.findUnique({
    where: { code: sessionCode.toUpperCase() },
    include: { room: true },
  });

  if (!session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  if (session.room.ownerId !== userId) {
    return { success: false, error: "権限がありません" };
  }

  if (session.state === "ended") {
    return { success: false, error: "終了したセッションは変更できません" };
  }

  // Validate passphrase requirements
  // Calculate final state after potential updates
  const finalPassphraseRequired =
    input.passphraseRequired ?? session.passphraseRequired;
  const finalPassphrase =
    input.passphrase !== undefined
      ? input.passphrase.trim()
      : session.passphrase;

  if (finalPassphraseRequired && finalPassphrase.length === 0) {
    return {
      success: false,
      error: "合言葉必須の場合、合言葉を設定してください",
    };
  }

  // Prepare session update data
  const sessionUpdateData: {
    passphrase?: string;
    passphraseRequired?: boolean;
    declaration?: string;
    state?: SessionState;
  } = {};

  if (input.passphrase !== undefined) {
    sessionUpdateData.passphrase = input.passphrase.trim();
  }
  if (input.passphraseRequired !== undefined) {
    sessionUpdateData.passphraseRequired = input.passphraseRequired;
  }
  if (input.declaration !== undefined) {
    sessionUpdateData.declaration = input.declaration;
  }
  if (input.state !== undefined) {
    // Validate state transition
    if (input.state === "ended") {
      return {
        success: false,
        error: "セッション終了には専用のAPIを使用してください",
      };
    }
    sessionUpdateData.state = input.state;
  }

  // Update session if there are changes
  if (Object.keys(sessionUpdateData).length > 0) {
    await prisma.session.update({
      where: { id: session.id },
      data: sessionUpdateData,
    });
  }

  // Update room-level approvalRequired if provided
  if (input.approvalRequired !== undefined) {
    await prisma.room.update({
      where: { id: session.roomId },
      data: { approvalRequired: input.approvalRequired },
    });
  }

  // Safety Lock Warning (D-011)
  // finalPassphraseRequired already calculated above
  const finalApprovalRequired =
    input.approvalRequired ?? session.room.approvalRequired;

  let warning: string | undefined;
  if (!finalPassphraseRequired && !finalApprovalRequired) {
    warning =
      "警告: 合言葉OFF + 承認OFF の状態です。誰でも即入室できる状態になります。荒らし対策として推奨しません。";
  }

  return { success: true, warning };
}

/**
 * Toggle session state between working and break
 */
export async function toggleSessionState(
  sessionCode: string,
  userId: string,
): Promise<{ success: boolean; newState?: SessionState; error?: string }> {
  const session = await prisma.session.findUnique({
    where: { code: sessionCode.toUpperCase() },
    include: { room: true },
  });

  if (!session) {
    return { success: false, error: "セッションが見つかりません" };
  }

  if (session.room.ownerId !== userId) {
    return { success: false, error: "権限がありません" };
  }

  if (session.state === "ended") {
    return { success: false, error: "終了したセッションは変更できません" };
  }

  const newState: SessionState =
    session.state === "working" ? "break" : "working";

  await prisma.session.update({
    where: { id: session.id },
    data: { state: newState },
  });

  return { success: true, newState };
}

// =============================================================================
// Utility
// =============================================================================

/**
 * Check if settings have safety lock issue (D-011)
 */
export function checkSafetyLock(
  passphraseRequired: boolean,
  approvalRequired: boolean,
): { isUnsafe: boolean; warning?: string } {
  if (!passphraseRequired && !approvalRequired) {
    return {
      isUnsafe: true,
      warning:
        "誰でも即入室できる状態になります。荒らし対策として推奨しません。",
    };
  }
  return { isUnsafe: false };
}
