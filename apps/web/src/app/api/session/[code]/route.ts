import { NextRequest, NextResponse } from 'next/server';
import { mockState } from '@/lib/mockState';

interface RouteParams {
  params: {
    code: string;
  };
}

/**
 * GET /api/session/[code]
 * セッション情報を取得（機密情報を除外）
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { code } = params;

    const session = mockState.getSession(code);
    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      );
    }

    // ユーザーの承認状態を取得（クエリパラメータからuserIdを取得）
    const userId = request.nextUrl.searchParams.get('userId');
    let userApprovalStatus: string | undefined;
    if (userId) {
      userApprovalStatus = mockState.getUserApprovalStatus(code, userId);
    }

    // 機密情報を除外してレスポンス
    return NextResponse.json({
      code: session.code,
      passphraseRequired: session.passphraseRequired,
      status: session.status,
      streamerName: session.streamerName,
      declaration: session.declaration,
      participantCount: session.participants.size,
      pendingCount: session.pendingApprovals.size,
      startedAt: session.startedAt.toISOString(),
      // ユーザー固有の承認状態
      userApprovalStatus,
    });
  } catch (error) {
    console.error('GET /api/session/[code] error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
