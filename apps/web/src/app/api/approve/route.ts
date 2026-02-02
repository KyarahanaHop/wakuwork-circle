import { NextRequest, NextResponse } from 'next/server';
import { mockState } from '@/lib/mockState';

/**
 * POST /api/approve
 * 参加リクエストの承認/拒否
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId, action } = body;

    // バリデーション
    if (!code || !userId || !action) {
      return NextResponse.json(
        { error: 'code, userId, action が必要です' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'action は approve または reject である必要があります' },
        { status: 400 }
      );
    }

    // セッション確認
    const session = mockState.getSession(code);
    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      );
    }

    // 承認/拒否処理
    let success: boolean;
    if (action === 'approve') {
      success = mockState.approveUser(code, userId);
    } else {
      success = mockState.rejectUser(code, userId);
    }

    if (!success) {
      return NextResponse.json(
        { error: '対象ユーザーが承認待ちリストにいません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      userId,
      sessionCode: code,
    });
  } catch (error) {
    console.error('POST /api/approve error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/approve?code=XXX
 * 承認待ちリストを取得（配信者用）
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'code が必要です' },
        { status: 400 }
      );
    }

    const session = mockState.getSession(code);
    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      );
    }

    const pendingUsers = mockState.getPendingUsers(code);
    const participants = mockState.getParticipants(code);

    return NextResponse.json({
      pending: pendingUsers.map(u => ({
        id: u.id,
        name: u.name,
        requestedAt: u.requestedAt.toISOString(),
        isFirstTime: u.isFirstTime,
      })),
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        isCompleted: p.isCompleted,
      })),
    });
  } catch (error) {
    console.error('GET /api/approve error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
