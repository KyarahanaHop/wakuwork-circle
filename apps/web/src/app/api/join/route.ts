import { NextRequest, NextResponse } from 'next/server';
import { mockState } from '@/lib/mockState';

/**
 * POST /api/join
 * セッションへの参加リクエスト
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, passphrase, userId, userName } = body;

    // バリデーション
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'セッションコードが必要です' },
        { status: 400 }
      );
    }

    // セッション検索
    const session = mockState.getSession(code);
    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      );
    }

    // 合言葉検証（必須の場合のみ）
    if (session.passphraseRequired) {
      if (!passphrase || passphrase !== session.passphrase) {
        return NextResponse.json(
          { error: '合言葉が違います' },
          { status: 403 }
        );
      }
    }

    // ユーザーIDを生成（実際はOAuth認証から取得）
    const finalUserId = userId || `user_${Date.now()}`;
    const finalUserName = userName || `ユーザー${Math.floor(Math.random() * 1000)}`;

    // pendingに追加（既に参加済みならapproved維持）
    const result = mockState.addPendingUser(code, {
      id: finalUserId,
      name: finalUserName,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: '参加リクエストの追加に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: finalUserId,
      userName: finalUserName,
      requiresApproval: !result.alreadyApproved, // 既に承認済みなら承認不要
      alreadyApproved: result.alreadyApproved,
      sessionCode: session.code,
    });
  } catch (error) {
    console.error('POST /api/join error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
