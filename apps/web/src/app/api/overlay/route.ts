import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/overlay?code=XXX
 * OBS overlay用の公開データを取得
 *
 * セキュリティ:
 * - 認証不要（OBSから直接アクセスするため）
 * - 個人情報（discordId等）は一切返さない
 * - セッションコードを知っている人のみアクセス可能
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "code が必要です" }, { status: 400 });
    }

    // Get session with minimal data needed for overlay
    const session = await prisma.session.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: {
          select: {
            isCompleted: true,
          },
        },
        joinRequests: {
          where: { status: "pending" },
          select: { id: true }, // Only count, no personal data
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    // Calculate stats
    const participantsCount = session.members.length;
    const completedCount = session.members.filter((m) => m.isCompleted).length;
    const pendingCount = session.joinRequests.length;

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
    const now = new Date();
    const startedAt = session.startedAt;
    const elapsedMs = now.getTime() - startedAt.getTime();
    const elapsedSec = Math.floor(elapsedMs / 1000);

    return NextResponse.json({
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
  } catch (error) {
    console.error("GET /api/overlay error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
