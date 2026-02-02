/**
 * Streamer Room API
 *
 * GET  - Get streamer's room with active session
 * POST - Create a new room (MVP: 1 streamer = 1 room)
 *
 * Requires: Authenticated streamer (isStreamer = true)
 *
 * See: docs/ssot/decisions.md A-005, D-007
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/user-sync";
import {
  getStreamerRoom,
  createRoom,
  checkSafetyLock,
} from "@/lib/services/room";

/**
 * GET /api/streamer/room
 *
 * Returns the streamer's room with active session info
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (!session.user.isStreamer) {
      return NextResponse.json(
        { error: "配信者権限が必要です" },
        { status: 403 },
      );
    }

    const userId = await ensureUser(session);
    const room = await getStreamerRoom(userId);

    if (!room) {
      return NextResponse.json({ room: null });
    }

    // Add safety lock warning if applicable
    let safetyWarning: string | undefined;
    if (room.activeSession) {
      const safetyCheck = checkSafetyLock(
        room.activeSession.passphraseRequired,
        room.approvalRequired,
      );
      if (safetyCheck.isUnsafe) {
        safetyWarning = safetyCheck.warning;
      }
    }

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        displayNameMode: room.displayNameMode,
        approvalRequired: room.approvalRequired,
        activeSession: room.activeSession
          ? {
              code: room.activeSession.code,
              passphrase: room.activeSession.passphrase,
              passphraseRequired: room.activeSession.passphraseRequired,
              state: room.activeSession.state,
              declaration: room.activeSession.declaration,
              startedAt: room.activeSession.startedAt.toISOString(),
              memberCount: room.activeSession.memberCount,
              pendingCount: room.activeSession.pendingCount,
            }
          : null,
      },
      safetyWarning,
    });
  } catch (error) {
    console.error("GET /api/streamer/room error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/streamer/room
 *
 * Create a new room
 * Body: { name: string, displayNameMode?: string, approvalRequired?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (!session.user.isStreamer) {
      return NextResponse.json(
        { error: "配信者権限が必要です" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "ルーム名は必須です" },
        { status: 400 },
      );
    }

    const name = body.name.trim();
    if (name.length === 0 || name.length > 50) {
      return NextResponse.json(
        { error: "ルーム名は1〜50文字で入力してください" },
        { status: 400 },
      );
    }

    const userId = await ensureUser(session);

    const result = await createRoom(userId, {
      name,
      displayNameMode: body.displayNameMode,
      approvalRequired: body.approvalRequired,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, roomId: result.roomId });
  } catch (error) {
    console.error("POST /api/streamer/room error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
