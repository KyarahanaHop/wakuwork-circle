'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface PendingUser {
  id: string;
  name: string;
  requestedAt: string;
  isFirstTime: boolean;
}

interface Participant {
  id: string;
  name: string;
  category: string;
  isCompleted: boolean;
}

interface SessionInfo {
  code: string;
  status: string;
  streamerName: string;
  declaration: string;
  participantCount: number;
  pendingCount: number;
}

// モックデータ（応援者は後で実装）
const mockSupporters = [
  { name: 'ユーザーA', amount: 1000, time: '14:30' },
  { name: 'ユーザーB', amount: 500, time: '14:25' },
  { name: 'ユーザーC', amount: 300, time: '14:20' },
];

export default function DashboardPage() {
  const params = useParams();
  const code = params.code as string;

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState('');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // セッション情報を取得
  const fetchSessionInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/session/${code}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('セッションが見つかりません');
        }
        return;
      }
      const data = await res.json();
      setSessionInfo(data);
    } catch {
      console.error('Failed to fetch session info');
    }
  }, [code]);

  // 承認待ち・参加者リストを取得
  const fetchApprovalList = useCallback(async () => {
    try {
      const res = await fetch(`/api/approve?code=${code}`);
      if (!res.ok) return;
      
      const data = await res.json();
      setPendingUsers(data.pending || []);
      setParticipants(data.participants || []);
    } catch {
      console.error('Failed to fetch approval list');
    }
  }, [code]);

  // 承認/拒否処理
  const handleApproval = async (userId: string, action: 'approve' | 'reject') => {
    setProcessingUserId(userId);
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId, action }),
      });

      if (res.ok) {
        // 即座に再取得
        await fetchApprovalList();
        await fetchSessionInfo();
      }
    } catch {
      console.error('Failed to process approval');
    } finally {
      setProcessingUserId(null);
    }
  };

  // 一括承認
  const handleApproveAll = async () => {
    for (const user of pendingUsers) {
      await handleApproval(user.id, 'approve');
    }
  };

  useEffect(() => {
    // 初回取得
    fetchSessionInfo();
    fetchApprovalList();

    // 3秒間隔でポーリング
    const interval = setInterval(() => {
      fetchSessionInfo();
      fetchApprovalList();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchSessionInfo, fetchApprovalList]);

  // 完了者数を計算
  const completedCount = participants.filter(p => p.isCompleted).length;
  const participantCount = sessionInfo?.participantCount || participants.length;
  const completionRate = participantCount > 0 
    ? Math.round((completedCount / participantCount) * 100) 
    : 0;

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 rounded-lg" style={{ background: 'var(--surface)' }}>
            <p className="text-lg mb-4" style={{ color: 'var(--danger)' }}>{error}</p>
            <Link 
              href="/"
              className="inline-block px-4 py-2 rounded-lg"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              トップに戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="text-sm px-3 py-1 rounded-md transition-colors"
            style={{ background: 'var(--surface2)', color: 'var(--text)' }}
          >
            ← 戻る
          </Link>
          <h1 className="text-lg font-semibold">Dashboard（配信者）</h1>
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
            {code}
          </span>
        </div>
        <ThemeSwitcher />
      </header>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* 承認ロビー */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
              承認ロビー ({pendingUsers.length}人待ち)
            </h2>
            {pendingUsers.length > 1 && (
              <button
                onClick={handleApproveAll}
                className="text-sm px-3 py-1 rounded-md transition-colors"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                一括承認
              </button>
            )}
          </div>
          
          {pendingUsers.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              現在承認待ちのユーザーはいません
            </p>
          ) : (
            <div className="space-y-2">
              {pendingUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ background: 'var(--surface2)' }}
                >
                  <div className="flex items-center gap-2">
                    <span>{user.name}</span>
                    {user.isFirstTime && (
                      <span 
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--accent)', color: 'white' }}
                      >
                        初回
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproval(user.id, 'approve')}
                      disabled={processingUserId === user.id}
                      className="px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ background: 'var(--success)', color: 'white' }}
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleApproval(user.id, 'reject')}
                      disabled={processingUserId === user.id}
                      className="px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ background: 'var(--danger)', color: 'white' }}
                    >
                      拒否
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Room Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>参加者</p>
            <p className="text-2xl font-bold">{participantCount}人</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>完了率</p>
            <p className="text-2xl font-bold">{completionRate}%</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>状態</p>
            <p className="text-2xl font-bold">
              {sessionInfo?.status === 'working' ? '作業中' : 
               sessionInfo?.status === 'break' ? '休憩中' : '—'}
            </p>
          </div>
        </div>

        {/* Current Declaration */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
            現在の宣言
          </h2>
          <p className="text-lg">{sessionInfo?.declaration || '—'}</p>
        </div>

        {/* 参加者一覧 */}
        {participants.length > 0 && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
              参加者一覧 ({participants.length}人)
            </h2>
            <div className="space-y-2">
              {participants.map((p) => (
                <div 
                  key={p.id}
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ background: 'var(--surface2)' }}
                >
                  <div className="flex items-center gap-2">
                    <span>{p.name}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      [{p.category}]
                    </span>
                  </div>
                  <span 
                    className="text-sm"
                    style={{ color: p.isCompleted ? 'var(--success)' : 'var(--muted)' }}
                  >
                    {p.isCompleted ? '✓ 完了' : '作業中'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supporters List */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
            応援者一覧（モック）
          </h2>
          <div className="space-y-2">
            {mockSupporters.map((supporter, i) => (
              <div 
                key={i}
                className="flex justify-between items-center p-3 rounded-lg"
                style={{ background: 'var(--surface2)' }}
              >
                <span>{supporter.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-semibold" style={{ color: 'var(--primary)' }}>
                    ¥{supporter.amount.toLocaleString()}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    {supporter.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 更新情報 */}
        <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
          3秒ごとに自動更新中
        </p>
      </div>
    </main>
  );
}
