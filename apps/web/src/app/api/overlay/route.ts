import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// B-2: Code pattern validation (6-12 uppercase alphanumeric)
const CODE_PATTERN = /^[A-Z0-9]{6,12}$/;

/**
 * GET /api/overlay?code=XXX
 * OBS overlay用の公開データを取得
 *
 * セキュリティ:
 * - 認証不要（OBSから直接アクセスするため）
 * - 個人情報（discordId等）は一切返さない
 * - セッションコードを知っている人のみアクセス可能
 * - B-2: 不正なcode形式はDBに問い合わせる前に弾く
 */
export async function GET(request: NextRequest) {
  try {
    const rawCode = request.nextUrl.searchParams.get("code");

    if (!rawCode) {
      return NextResponse.json({ error: "code が必要です" }, { status: 400 });
    }

    // B-2: Validate code format before DB query (brute-force mitigation)
    const code = rawCode.toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      // Return 404 to avoid existence inference (same as "not found")
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    // Get session (minimal fields only)
    const session = await prisma.session.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        state: true,
        startedAt: true,
        endedAt: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    // B-1: Use count queries instead of fetching arrays (lightweight)
    const [participantsCount, completedCount, pendingCount] = await Promise.all(
      [
        prisma.sessionMember.count({ where: { sessionId: session.id } }),
        prisma.sessionMember.count({
          where: { sessionId: session.id, isCompleted: true },
        }),
        prisma.joinRequest.count({
          where: { sessionId: session.id, status: "pending" },
        }),
      ],
    );

    // Get recent stamps (last 60 seconds, aggregated by type)
    const sixtySecondsAgo = new Date(Date.now() - 60000);
    const recentStamps = await prisma.stampEvent.groupBy({
      by: ["stampType"],
      where: {
        sessionId: session.id,
        createdAt: { gte: sixtySecondsAgo },
      },
      _count: { stampType: true },
      _max: { createdAt: true },
    });

    const stamps = recentStamps.map((s) => ({
      type: s.stampType,
      count: s._count.stampType,
      lastAt: s._max.createdAt?.toISOString(),
    }));

    // Get latest support event (without personal identifiers)
    const latestSupport = await prisma.supportEvent.findFirst({
      where: { sessionId: session.id },
      orderBy: { createdAt: "desc" },
      select: {
        amount: true,
        message: true,
        createdAt: true,
        // NO user info - just use a generic display
      },
    });

    // Calculate elapsed time
    // If session has ended, use endedAt for fixed elapsed time
    const now = new Date();
    const startedAt = session.startedAt;
    const endTime = session.endedAt ?? now;
    const elapsedMs = endTime.getTime() - startedAt.getTime();
    const elapsedSec = Math.floor(elapsedMs / 1000);

    const response = NextResponse.json({
      code: session.code,
      state: session.state,
      startedAt: startedAt.toISOString(),
      elapsedSec,
      participantsCount,
      completedCount,
      pendingCount,
      stamps,
      latestSupport: latestSupport
        ? {
            amount: latestSupport.amount,
            message: latestSupport.message,
            createdAt: latestSupport.createdAt.toISOString(),
          }
        : null,
    });

    // D-012: Cache-Control: no-store for real-time data
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("GET /api/overlay error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
