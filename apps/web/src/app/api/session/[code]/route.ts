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
 * セッション情報を取得（認証状態で返す情報が変わる）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = params;

    // Get session info
    const info = await getSessionInfo(code);
    if (!info) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    // Check authentication for user-specific data
    const session = await auth();
    let userApprovalStatus: string | null = null;
    let userId: string | null = null;

    if (session?.user) {
      userId = await ensureUser(session);
      const status = await getUserApprovalStatus(code, userId);
      userApprovalStatus = status;
    }

    // Base response (public info)
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

    // Add user-specific data if authenticated
    if (userId) {
      response.userApprovalStatus = userApprovalStatus;
    }

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
      if (userId) {
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
