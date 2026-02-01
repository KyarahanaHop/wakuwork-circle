'use client';

import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

// モックデータ
const mockDashboardData = {
  roomId: 'room-001',
  streamerName: 'サンプル配信者',
  status: 'working',
  timer: '45:23',
  participants: 12,
  completed: 8,
  declaration: 'デザインシステムの設計とドキュメント作成',
  supporters: [
    { name: 'ユーザーA', amount: 1000, time: '14:30' },
    { name: 'ユーザーB', amount: 500, time: '14:25' },
    { name: 'ユーザーC', amount: 300, time: '14:20' },
  ],
  reports: [],
};

export default function DashboardPage() {
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
        </div>
        <ThemeSwitcher />
      </header>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Room Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>参加者</p>
            <p className="text-2xl font-bold">{mockDashboardData.participants}人</p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>完了率</p>
            <p className="text-2xl font-bold">
              {Math.round((mockDashboardData.completed / mockDashboardData.participants) * 100)}%
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>経過時間</p>
            <p className="text-2xl font-bold">{mockDashboardData.timer}</p>
          </div>
        </div>

        {/* Current Declaration */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
            現在の宣言
          </h2>
          <p className="text-lg">{mockDashboardData.declaration}</p>
        </div>

        {/* Status Control */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
            状態切り替え
          </h2>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{ 
                background: mockDashboardData.status === 'working' ? 'var(--primary)' : 'var(--surface2)',
                color: mockDashboardData.status === 'working' ? 'var(--primaryText)' : 'var(--text)'
              }}
            >
              作業中
            </button>
            <button
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{ 
                background: mockDashboardData.status === 'break' ? 'var(--warning)' : 'var(--surface2)',
                color: mockDashboardData.status === 'break' ? '#000' : 'var(--text)'
              }}
            >
              休憩中
            </button>
          </div>
        </div>

        {/* Supporters List */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
            応援者一覧
          </h2>
          <div className="space-y-2">
            {mockDashboardData.supporters.map((supporter, i) => (
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

        {/* Reports Queue */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
            通報キュー
          </h2>
          {mockDashboardData.reports.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              現在通報はありません
            </p>
          ) : (
            <div className="space-y-2">
              {mockDashboardData.reports.map((report, i) => (
                <div key={i}>通報内容</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
