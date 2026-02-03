import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/user-sync";
import {
  getSessionInfo,
  getUserApprovalStatus,
  getSessionParticipants,
  getMemberStatus,
} from "@/lib/services/session";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    code: string;
  };
}

/**
 * GET /api/session/[code]
 * セッション情報を取得
 *
 * D-004: 閲覧専用ゲストなし - 全員OAuth必須
 * 認証必須。未認証ユーザーには最小限の情報のみ返す（セッション存在確認 + passphrase要否）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = params;

    // Check authentication first (D-004: 全員OAuth必須)
    const session = await auth();

    // Get session info
    const info = await getSessionInfo(code);
    if (!info) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    // For unauthenticated users, return minimal info only
    // This allows the join flow to work (show passphrase input if needed)
    // but prevents content guessing/scraping (D-004: 外部閲覧提供しない)
    if (!session?.user) {
      return NextResponse.json({
        code: info.code,
        passphraseRequired: info.passphraseRequired,
        status: info.status,
        // No streamer name, room name, declaration, participant count, etc.
        // User must authenticate to see room content
      });
    }

    const userId = await ensureUser(session);
    const userApprovalStatus = await getUserApprovalStatus(code, userId);

    // Full response for authenticated users
    const response: Record<string, unknown> = {
      code: info.code,
      passphraseRequired: info.passphraseRequired,
      status: info.status,
      streamerName: info.streamerName,
      declaration: info.declaration,
      participantCount: info.participantCount,
      pendingCount: info.pendingCount,
      startedAt: info.startedAt,
      displayNameMode: info.displayNameMode,
      roomName: info.roomName,
    };

    // Add user-specific data
    response.userApprovalStatus = userApprovalStatus;

    // If user is a member, add support events (time-ordered, latest 10)
    if (userApprovalStatus === "member" || userApprovalStatus === "approved") {
      const sessionRecord = await prisma.session.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (sessionRecord) {
        // Get support events - TIME-ORDERED ONLY (D-010: no sorting by amount)
        const supportEvents = await prisma.supportEvent.findMany({
          where: { sessionId: sessionRecord.id },
          orderBy: { createdAt: "desc" }, // Time-ordered only
          take: 10, // Latest 10 only
          include: {
            user: true,
          },
        });

        // Get participants for display name lookup
        const participants = await getSessionParticipants(code);
        const participantMap = new Map(participants.map((p) => [p.id, p.name]));

        response.supportEvents = supportEvents.map((e) => ({
          id: e.id,
          displayName: participantMap.get(e.userId) || "Unknown",
          amount: e.amount,
          message: e.message,
          createdAt: e.createdAt.toISOString(),
        }));

        // NOTE: No totals, rankings, or sorted views (D-010 anti-pressure rules)
      }

      // Add user's current member status
      const memberStatus = await getMemberStatus(code, userId);
      if (memberStatus) {
        response.myStatus = {
          category: memberStatus.category,
          shortText: memberStatus.shortText,
          isCompleted: memberStatus.isCompleted,
          displayName: memberStatus.displayName,
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/session/[code] error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
