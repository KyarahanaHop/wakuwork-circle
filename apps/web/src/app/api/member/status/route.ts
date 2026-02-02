/**
 * Member Status API
 *
 * PATCH - Update member's work status (category, shortText, isCompleted)
 *
 * Requires: Authenticated user who is a session member
 *
 * See: docs/ssot/flows.md Section 3
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/user-sync";
import {
  updateMemberStatus,
  WORK_CATEGORIES,
  type WorkCategory,
} from "@/lib/services/session";

/**
 * PATCH /api/member/status
 *
 * Update the current user's work status in a session
 * Body: {
 *   code: string,              // Required: Session code
 *   category?: string,         // Optional: Work category
 *   shortText?: string,        // Optional: Short status text (max 50 chars)
 *   isCompleted?: boolean      // Optional: Completion status
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const userId = await ensureUser(session);

    if (!body.code || typeof body.code !== "string") {
      return NextResponse.json(
        { error: "セッションコードが必要です" },
        { status: 400 },
      );
    }

    // Validate category if provided
    if (
      body.category !== undefined &&
      !WORK_CATEGORIES.includes(body.category as WorkCategory)
    ) {
      return NextResponse.json(
        { error: "無効なカテゴリです" },
        { status: 400 },
      );
    }

    // Validate shortText if provided
    if (body.shortText !== undefined && typeof body.shortText !== "string") {
      return NextResponse.json(
        { error: "短文は文字列で入力してください" },
        { status: 400 },
      );
    }

    if (body.shortText !== undefined && body.shortText.length > 50) {
      return NextResponse.json(
        { error: "短文は50文字以内で入力してください" },
        { status: 400 },
      );
    }

    // Validate isCompleted if provided
    if (
      body.isCompleted !== undefined &&
      typeof body.isCompleted !== "boolean"
    ) {
      return NextResponse.json(
        { error: "完了状態は真偽値で入力してください" },
        { status: 400 },
      );
    }

    const result = await updateMemberStatus(body.code, userId, {
      category: body.category,
      shortText: body.shortText,
      isCompleted: body.isCompleted,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/member/status error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
