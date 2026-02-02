/**
 * Streamer Session End API
 *
 * POST - End the current session
 *
 * Requires: Authenticated streamer (isStreamer = true)
 *
 * See: docs/ssot/flows.md Section 2
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/user-sync";
import { endSession } from "@/lib/services/room";

/**
 * POST /api/streamer/session/end
 *
 * End the specified session
 * Body: { code: string }
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

    if (!body.code || typeof body.code !== "string") {
      return NextResponse.json(
        { error: "セッションコードが必要です" },
        { status: 400 },
      );
    }

    const result = await endSession(body.code, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/streamer/session/end error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
