import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/user-sync";
import { processJoinRequest, getSessionInfo } from "@/lib/services/session";

/**
 * POST /api/join
 * セッションへの参加リクエスト
 *
 * Required: Discord OAuth authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { code, passphrase } = body;

    // Validate input
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "セッションコードが必要です" },
        { status: 400 },
      );
    }

    // Ensure user exists in database
    const userId = await ensureUser(session);

    // Process join request
    const result = await processJoinRequest(code, userId, passphrase);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "セッションが見つかりません" ? 404 : 403 },
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      userName: session.user.discordName,
      requiresApproval: result.requiresApproval,
      alreadyApproved: result.alreadyApproved,
      sessionCode: result.sessionCode,
    });
  } catch (error) {
    console.error("POST /api/join error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/join?code=XXX
 * Check if session exists and get basic info (no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "セッションコードが必要です" },
        { status: 400 },
      );
    }

    const info = await getSessionInfo(code);
    if (!info) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    // Return basic info (no sensitive data)
    return NextResponse.json({
      code: info.code,
      passphraseRequired: info.passphraseRequired,
      streamerName: info.streamerName,
      status: info.status,
    });
  } catch (error) {
    console.error("GET /api/join error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
