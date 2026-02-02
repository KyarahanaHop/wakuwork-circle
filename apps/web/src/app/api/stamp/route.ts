/**
 * Stamp API
 *
 * POST - Send a stamp to a session
 *
 * Requires: Authenticated user who is a session member
 *
 * See: docs/ssot/flows.md Section 4
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/user-sync";
import { sendStamp, STAMP_TYPES } from "@/lib/services/stamp";

/**
 * POST /api/stamp
 *
 * Send a stamp to a session
 * Body: {
 *   code: string,     // Required: Session code
 *   stampType: string // Required: wave, like, alert, sleepy
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const userId = await ensureUser(session);

    // Validate required fields
    if (!body.code || typeof body.code !== "string") {
      return NextResponse.json(
        { error: "セッションコードが必要です" },
        { status: 400 },
      );
    }

    if (!body.stampType || typeof body.stampType !== "string") {
      return NextResponse.json(
        { error: "スタンプタイプが必要です" },
        { status: 400 },
      );
    }

    // Validate stamp type
    if (!STAMP_TYPES.includes(body.stampType)) {
      return NextResponse.json(
        { error: "無効なスタンプタイプです" },
        { status: 400 },
      );
    }

    const result = await sendStamp(body.code, userId, body.stampType);

    if (!result.success) {
      // Determine appropriate status code based on error
      let statusCode = 400; // Default for unknown errors

      if (result.error?.includes("見つかりません")) {
        statusCode = 404;
      } else if (result.error?.includes("参加していません")) {
        statusCode = 403;
      } else if (result.error?.includes("ミュート")) {
        statusCode = 403;
      } else if (result.error?.includes("終了した")) {
        statusCode = 409; // Conflict - session ended
      } else if (
        result.error?.includes("間隔") ||
        result.error?.includes("回まで")
      ) {
        statusCode = 429; // Rate limit
      }

      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      stampId: result.stampId,
    });
  } catch (error) {
    console.error("POST /api/stamp error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
