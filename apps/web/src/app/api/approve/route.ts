import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/user-sync";
import {
  approveJoinRequest,
  rejectJoinRequest,
  getPendingUsers,
  getSessionParticipants,
} from "@/lib/services/session";

/**
 * POST /api/approve
 * 参加リクエストの承認/拒否（配信者のみ）
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

    // Check if user is a streamer
    if (!session.user.isStreamer) {
      return NextResponse.json(
        { error: "配信者のみがこの操作を実行できます" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { code, userId, action } = body;

    // Validate input
    if (!code || !userId || !action) {
      return NextResponse.json(
        { error: "code, userId, action が必要です" },
        { status: 400 },
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action は approve または reject である必要があります" },
        { status: 400 },
      );
    }

    // Get actor's internal user ID
    const actorUserId = await ensureUser(session);

    // Process approval/rejection
    let result;
    if (action === "approve") {
      result = await approveJoinRequest(code, userId, actorUserId);
    } else {
      result = await rejectJoinRequest(code, userId, actorUserId);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      action,
      userId,
      sessionCode: code,
    });
  } catch (error) {
    console.error("POST /api/approve error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/approve?code=XXX
 * 承認待ちリストと参加者リストを取得（配信者のみ）
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 },
      );
    }

    // Check if user is a streamer
    if (!session.user.isStreamer) {
      return NextResponse.json(
        { error: "配信者のみがこの情報を閲覧できます" },
        { status: 403 },
      );
    }

    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "code が必要です" }, { status: 400 });
    }

    // Get pending users and participants
    const [pending, participants] = await Promise.all([
      getPendingUsers(code),
      getSessionParticipants(code),
    ]);

    return NextResponse.json({
      pending: pending.map((u) => ({
        id: u.id,
        name: u.name,
        nickname: u.nickname,
        discordId: u.discordId, // Streamers can see Discord info for moderation
        discordName: u.name,
        requestedAt: u.requestedAt,
        isFirstTime: u.isFirstTime,
      })),
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
        discordId: p.discordId, // Streamers can see Discord info for moderation
        discordName: p.discordName,
        category: p.category,
        shortText: p.shortText,
        isCompleted: p.isCompleted,
        isMuted: p.isMuted,
      })),
    });
  } catch (error) {
    console.error("GET /api/approve error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
