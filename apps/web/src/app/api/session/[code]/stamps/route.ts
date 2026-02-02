/**
 * Session Stamps API
 *
 * GET - Get recent stamps for polling
 *
 * Requires: Authenticated user who is a session member
 *
 * See: docs/ssot/flows.md Section 4
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/user-sync";
import { getRecentStamps } from "@/lib/services/stamp";
import { getUserApprovalStatus } from "@/lib/services/session";

interface RouteParams {
  params: {
    code: string;
  };
}

/**
 * GET /api/session/[code]/stamps
 *
 * Get recent stamps for a session (for polling)
 * Query params:
 *   since?: string - ISO timestamp to get stamps after (exclusive)
 *
 * Returns stamps from the last 10 seconds
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const userId = await ensureUser(session);

    // Check if user is a member
    const status = await getUserApprovalStatus(code, userId);
    if (status !== "member" && status !== "approved") {
      return NextResponse.json(
        { error: "セッションに参加していません" },
        { status: 403 },
      );
    }

    // Get since timestamp from query params
    const since = request.nextUrl.searchParams.get("since") || undefined;

    // Get recent stamps
    const stamps = await getRecentStamps(code, since);

    return NextResponse.json({
      stamps,
      // Include the last stamp's createdAt for next poll (cursor)
      lastTimestamp:
        stamps.length > 0 ? stamps[stamps.length - 1].createdAt : null,
    });
  } catch (error) {
    console.error("GET /api/session/[code]/stamps error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
