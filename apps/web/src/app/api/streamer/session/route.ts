/**
 * Streamer Session API
 *
 * POST  - Start a new session
 * PATCH - Update session settings (passphrase, flags, state, declaration)
 *
 * Requires: Authenticated streamer (isStreamer = true)
 *
 * See: docs/ssot/flows.md Section 2, docs/ssot/decisions.md D-011
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/user-sync";
import {
  getStreamerRoom,
  startSession,
  updateSessionSettings,
  toggleSessionState,
} from "@/lib/services/room";

/**
 * POST /api/streamer/session
 *
 * Start a new session in the streamer's room
 * Body: { passphrase: string, passphraseRequired?: boolean, declaration?: string }
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
    const userId = await ensureUser(session);

    // Get streamer's room
    const room = await getStreamerRoom(userId);
    if (!room) {
      return NextResponse.json(
        { error: "ルームが見つかりません。先にルームを作成してください。" },
        { status: 400 },
      );
    }

    // Validate passphrase
    if (
      body.passphraseRequired !== false &&
      (!body.passphrase || typeof body.passphrase !== "string")
    ) {
      return NextResponse.json(
        { error: "合言葉必須の場合、合言葉を設定してください" },
        { status: 400 },
      );
    }

    const passphrase =
      typeof body.passphrase === "string" ? body.passphrase.trim() : "";

    const result = await startSession(userId, {
      roomId: room.id,
      passphrase,
      passphraseRequired: body.passphraseRequired,
      declaration: body.declaration,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sessionCode: result.sessionCode,
    });
  } catch (error) {
    console.error("POST /api/streamer/session error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/streamer/session
 *
 * Update session settings
 * Body: {
 *   code: string,              // Required: Session code
 *   passphrase?: string,       // Optional: Update passphrase
 *   passphraseRequired?: boolean,
 *   approvalRequired?: boolean, // Room-level setting
 *   declaration?: string,
 *   state?: 'working' | 'break',
 *   toggleState?: boolean      // If true, toggle between working/break
 * }
 */
export async function PATCH(request: NextRequest) {
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
    const userId = await ensureUser(session);

    if (!body.code || typeof body.code !== "string") {
      return NextResponse.json(
        { error: "セッションコードが必要です" },
        { status: 400 },
      );
    }

    // Handle state toggle separately
    if (body.toggleState === true) {
      const toggleResult = await toggleSessionState(body.code, userId);

      if (!toggleResult.success) {
        return NextResponse.json(
          { error: toggleResult.error },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        newState: toggleResult.newState,
      });
    }

    // Update settings
    const result = await updateSessionSettings(body.code, userId, {
      passphrase: body.passphrase,
      passphraseRequired: body.passphraseRequired,
      approvalRequired: body.approvalRequired,
      declaration: body.declaration,
      state: body.state,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      warning: result.warning,
    });
  } catch (error) {
    console.error("PATCH /api/streamer/session error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
