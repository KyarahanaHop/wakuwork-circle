/**
 * Mock State - メモリベースのセッション状態管理
 * 
 * MVPでDB不使用のため、globalThisを使ってHMR耐性を確保したメモリストア。
 * Phase 2で使用、本実装ではDB + WebSocketに置換予定。
 */

// =============================================================================
// Types
// =============================================================================

export type SessionStatus = 'working' | 'break' | 'ended';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PendingUser {
  id: string;
  name: string;
  requestedAt: Date;
  isFirstTime: boolean;
}

export interface Participant {
  id: string;
  name: string;
  category: string;
  shortText: string;
  isCompleted: boolean;
  joinedAt: Date;
}

export interface Session {
  code: string;
  passphrase: string;
  passphraseRequired: boolean;
  status: SessionStatus;
  streamerName: string;
  declaration: string;
  startedAt: Date;
  participants: Map<string, Participant>;
  pendingApprovals: Map<string, PendingUser>;
}

export interface UserApprovalState {
  sessionCode: string;
  status: ApprovalStatus;
}

// =============================================================================
// Global State (HMR耐性)
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __mockState: {
    sessions: Map<string, Session>;
    userApprovals: Map<string, UserApprovalState>; // key: `${sessionCode}:${userId}`
  } | undefined;
}

function getGlobalState() {
  if (!globalThis.__mockState) {
    globalThis.__mockState = {
      sessions: new Map(),
      userApprovals: new Map(),
    };
    // 開発用の初期セッションを作成（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      initializeDevSessions();
    }
  }
  return globalThis.__mockState;
}

// =============================================================================
// 初期化（開発用モックセッション）
// =============================================================================

function initializeDevSessions() {
  const state = globalThis.__mockState!;
  
  // ABC123: 合言葉必須
  if (!state.sessions.has('ABC123')) {
    state.sessions.set('ABC123', {
      code: 'ABC123',
      passphrase: 'waku',
      passphraseRequired: true,
      status: 'working',
      streamerName: 'デモ配信者',
      declaration: 'MVPの動作確認をしています',
      startedAt: new Date(),
      participants: new Map(),
      pendingApprovals: new Map(),
    });
  }
  
  // XYZ789: 合言葉不要
  if (!state.sessions.has('XYZ789')) {
    state.sessions.set('XYZ789', {
      code: 'XYZ789',
      passphrase: '',
      passphraseRequired: false,
      status: 'working',
      streamerName: 'オープン配信者',
      declaration: '誰でも参加できるセッション',
      startedAt: new Date(),
      participants: new Map(),
      pendingApprovals: new Map(),
    });
  }
}

// =============================================================================
// Public API
// =============================================================================

export const mockState = {
  /**
   * セッションを取得
   */
  getSession(code: string): Session | undefined {
    return getGlobalState().sessions.get(code.toUpperCase());
  },

  /**
   * セッションを作成（配信者用）
   */
  createSession(params: {
    code: string;
    passphrase: string;
    passphraseRequired: boolean;
    streamerName: string;
    declaration?: string;
  }): Session {
    const session: Session = {
      code: params.code.toUpperCase(),
      passphrase: params.passphrase,
      passphraseRequired: params.passphraseRequired,
      status: 'working',
      streamerName: params.streamerName,
      declaration: params.declaration || '',
      startedAt: new Date(),
      participants: new Map(),
      pendingApprovals: new Map(),
    };
    getGlobalState().sessions.set(session.code, session);
    return session;
  },

  /**
   * 参加リクエストを追加（pending状態へ）
   * - 既にparticipants（承認済み）の場合はpendingにせずapproved維持
   * - 既にpending中の場合は更新しない
   */
  addPendingUser(code: string, user: { id: string; name: string }): { success: boolean; alreadyApproved: boolean } {
    const session = this.getSession(code);
    if (!session) return { success: false, alreadyApproved: false };

    const normalizedCode = session.code; // 正規化済み（getSessionで大文字化）

    // 既に参加済み（approved）なら、pendingに戻さずapproved維持
    if (session.participants.has(user.id)) {
      const key = `${normalizedCode}:${user.id}`;
      getGlobalState().userApprovals.set(key, {
        sessionCode: normalizedCode,
        status: 'approved',
      });
      return { success: true, alreadyApproved: true };
    }

    // 既にpending中なら何もしない
    if (session.pendingApprovals.has(user.id)) {
      return { success: true, alreadyApproved: false };
    }

    const pendingUser: PendingUser = {
      id: user.id,
      name: user.name,
      requestedAt: new Date(),
      isFirstTime: true,
    };
    session.pendingApprovals.set(user.id, pendingUser);
    
    // ユーザーの承認状態を記録（正規化済みキー）
    const key = `${normalizedCode}:${user.id}`;
    getGlobalState().userApprovals.set(key, {
      sessionCode: normalizedCode,
      status: 'pending',
    });
    
    return { success: true, alreadyApproved: false };
  },

  /**
   * ユーザーの承認状態を取得
   */
  getUserApprovalStatus(code: string, userId: string): ApprovalStatus | undefined {
    const key = `${code.toUpperCase()}:${userId}`;
    return getGlobalState().userApprovals.get(key)?.status;
  },

  /**
   * ユーザーを承認
   */
  approveUser(code: string, userId: string): boolean {
    const session = this.getSession(code);
    if (!session) return false;

    const normalizedCode = session.code; // 正規化済み
    const pending = session.pendingApprovals.get(userId);
    if (!pending) return false;

    // pendingから削除
    session.pendingApprovals.delete(userId);

    // participantsに追加
    const participant: Participant = {
      id: userId,
      name: pending.name,
      category: 'その他',
      shortText: '',
      isCompleted: false,
      joinedAt: new Date(),
    };
    session.participants.set(userId, participant);

    // 承認状態を更新（正規化済みキー）
    const key = `${normalizedCode}:${userId}`;
    getGlobalState().userApprovals.set(key, {
      sessionCode: normalizedCode,
      status: 'approved',
    });

    return true;
  },

  /**
   * ユーザーを拒否
   */
  rejectUser(code: string, userId: string): boolean {
    const session = this.getSession(code);
    if (!session) return false;

    const normalizedCode = session.code; // 正規化済み
    const pending = session.pendingApprovals.get(userId);
    if (!pending) return false;

    // pendingから削除
    session.pendingApprovals.delete(userId);

    // 拒否状態を記録（正規化済みキー）
    const key = `${normalizedCode}:${userId}`;
    getGlobalState().userApprovals.set(key, {
      sessionCode: normalizedCode,
      status: 'rejected',
    });

    return true;
  },

  /**
   * 承認待ちリストを取得
   */
  getPendingUsers(code: string): PendingUser[] {
    const session = this.getSession(code);
    if (!session) return [];
    return Array.from(session.pendingApprovals.values());
  },

  /**
   * 参加者リストを取得
   */
  getParticipants(code: string): Participant[] {
    const session = this.getSession(code);
    if (!session) return [];
    return Array.from(session.participants.values());
  },

  /**
   * セッション状態を変更（working/break）
   */
  setSessionStatus(code: string, status: SessionStatus): boolean {
    const session = this.getSession(code);
    if (!session) return false;
    session.status = status;
    return true;
  },

  /**
   * デバッグ用: 全セッションを取得
   */
  getAllSessions(): Session[] {
    return Array.from(getGlobalState().sessions.values());
  },

  /**
   * デバッグ用: 状態をリセット
   */
  reset(): void {
    globalThis.__mockState = undefined;
    getGlobalState(); // 再初期化
  },
};

// デフォルトエクスポート
export default mockState;
