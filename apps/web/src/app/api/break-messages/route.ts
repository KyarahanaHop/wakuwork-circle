import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user-sync";

/**
 * TASK-006: 休憩ひとこと API
 *
 * - 休憩中(state=break)のみ投稿/閲覧可能
 * - "会話"ではなく"ひとことフィード" - 返信/スレッド禁止
 * - 互恵性を作らない設計
 */

// Validation constants
const MAX_CONTENT_LENGTH = 30;
const RATE_LIMIT_SECONDS = 5;
const MAX_MESSAGES_RETURN = 20;
const CODE_PATTERN = /^[A-Z0-9]{6,12}$/;

/**
 * GET /api/break-messages?code=XXXX
 * 休憩ひとことフィードを取得（最新20件）
 *
 * - 認証必須（approved member）
 * - state=break でなければ空配列を返す（UX優先）
 * - 個人情報は返さない（authorIdは除外）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const rawCode = request.nextUrl.searchParams.get("code");
    if (!rawCode) {
      return NextResponse.json({ error: "code が必要です" }, { status: 400 });
    }

    const code = rawCode.toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    const userId = await ensureUser(session);

    // Get session and verify user is approved member
    const dbSession = await prisma.session.findUnique({
      where: { code },
      select: {
        id: true,
        state: true,
        members: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (!dbSession) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    // Check if user is approved member
    if (dbSession.members.length === 0) {
      return NextResponse.json(
        { error: "参加承認が必要です" },
        { status: 403 },
      );
    }

    // If not in break state, return empty array (UX: silent fail)
    if (dbSession.state !== "break") {
      const response = NextResponse.json({ messages: [] });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    // Get latest 20 messages (no personal data)
    const messages = await prisma.breakMessage.findMany({
      where: { sessionId: dbSession.id },
      orderBy: { createdAt: "desc" },
      take: MAX_MESSAGES_RETURN,
      select: {
        id: true,
        content: true,
        createdAt: true,
        // NO authorId - privacy
      },
    });

    // Reverse to show oldest first (chronological order)
    const response = NextResponse.json({
      messages: messages.reverse().map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });

    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("GET /api/break-messages error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/break-messages?code=XXXX
 * 休憩ひとことを投稿
 *
 * - 認証必須（approved member）
 * - state=break のみ投稿可能
 * - 5秒レート制限
 * - 30文字以内、改行禁止
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const rawCode = request.nextUrl.searchParams.get("code");
    if (!rawCode) {
      return NextResponse.json({ error: "code が必要です" }, { status: 400 });
    }

    const code = rawCode.toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    const userId = await ensureUser(session);

    // Parse and validate content
    const body = await request.json();
    const rawContent = body.content;

    if (typeof rawContent !== "string") {
      return NextResponse.json(
        { error: "content が必要です" },
        { status: 400 },
      );
    }

    // Trim and validate content
    const content = rawContent.trim();

    if (content.length === 0) {
      return NextResponse.json(
        { error: "メッセージが空です" },
        { status: 400 },
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `メッセージは${MAX_CONTENT_LENGTH}文字以内です` },
        { status: 400 },
      );
    }

    // Check for newlines (forbidden)
    if (content.includes("\n") || content.includes("\r")) {
      return NextResponse.json(
        { error: "改行は使用できません" },
        { status: 400 },
      );
    }

    // Get session and verify user is approved member
    const dbSession = await prisma.session.findUnique({
      where: { code },
      select: {
        id: true,
        state: true,
        members: {
          where: { userId },
          select: { id: true, isMuted: true, muteExpiresAt: true },
        },
      },
    });

    if (!dbSession) {
      return NextResponse.json(
        { error: "セッションが見つかりません" },
        { status: 404 },
      );
    }

    // Check if user is approved member
    if (dbSession.members.length === 0) {
      return NextResponse.json(
        { error: "参加承認が必要です" },
        { status: 403 },
      );
    }

    // Check if muted
    const member = dbSession.members[0];
    if (member.isMuted) {
      // Check if mute has expired
      if (!member.muteExpiresAt || member.muteExpiresAt > new Date()) {
        return NextResponse.json(
          { error: "ミュート中は投稿できません" },
          { status: 403 },
        );
      }
    }

    // Check state is break
    if (dbSession.state !== "break") {
      return NextResponse.json(
        { error: "休憩中のみ投稿できます" },
        { status: 403 },
      );
    }

    // Rate limit: 5 seconds between posts per user
    const fiveSecondsAgo = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000);
    const recentMessage = await prisma.breakMessage.findFirst({
      where: {
        sessionId: dbSession.id,
        authorId: userId,
        createdAt: { gte: fiveSecondsAgo },
      },
      select: { id: true },
    });

    if (recentMessage) {
      return NextResponse.json(
        { error: "投稿間隔が短すぎます（5秒待ってください）" },
        { status: 429 },
      );
    }

    // Create message
    const message = await prisma.breakMessage.create({
      data: {
        sessionId: dbSession.id,
        authorId: userId,
        content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("POST /api/break-messages error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
