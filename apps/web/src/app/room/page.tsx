'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

// モックデータ
const mockRoomData = {
  id: 'room-001',
  streamerName: 'サンプル配信者',
  status: 'working', // 'working' | 'break'
  timer: '45:23',
  declaration: 'デザインシステムの設計とドキュメント作成',
  participants: 12,
  completed: 8,
  supportOptions: [
    { amount: 300, label: '応援' },
    { amount: 500, label: '応援' },
    { amount: 1000, label: '応援' },
    { amount: 3000, label: '応援' },
  ],
  chatMessages: [
    { user: 'ユーザーA', message: '頑張ってください！', time: '14:30' },
    { user: 'ユーザーB', message: '同期して作業します', time: '14:32' },
  ],
};

export default function RoomPage() {
  const [isCompleted, setIsCompleted] = useState(false);

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
          <h1 className="text-lg font-semibold">{mockRoomData.streamerName}の部屋</h1>
        </div>
        <ThemeSwitcher />
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Status & Timer */}
        <div 
          className="p-4 rounded-lg flex justify-between items-center"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-3">
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                background: mockRoomData.status === 'working' ? 'var(--primary)' : 'var(--warning)',
                color: mockRoomData.status === 'working' ? 'var(--primaryText)' : '#000'
              }}
            >
              {mockRoomData.status === 'working' ? '作業中' : '休憩中'}
            </span>
            <span style={{ color: 'var(--muted)' }}>
              参加者: {mockRoomData.participants}人
            </span>
          </div>
          <span className="text-3xl font-mono font-bold">
            {mockRoomData.timer}
          </span>
        </div>

        {/* Declaration */}
        <div 
          className="p-6 rounded-lg"
          style={{ background: 'var(--surface)' }}
        >
          <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
            今回の宣言
          </h2>
          <p className="text-lg font-medium" style={{ color: 'var(--primary)' }}>
            {mockRoomData.declaration}
          </p>
        </div>

        {/* Complete Button */}
        <button
          onClick={() => setIsCompleted(!isCompleted)}
          className="w-full py-4 rounded-lg font-semibold text-lg transition-all"
          style={{ 
            background: isCompleted ? 'var(--success)' : 'var(--primary)',
            color: isCompleted ? '#fff' : 'var(--primaryText)',
            borderRadius: 'var(--r-md)'
          }}
        >
          {isCompleted ? '✓ 完了済み' : '完了！'}
        </button>

        {/* Progress */}
        <div className="flex justify-between text-sm" style={{ color: 'var(--muted)' }}>
          <span>完了: {mockRoomData.completed}人 / {mockRoomData.participants}人</span>
          <span>{Math.round((mockRoomData.completed / mockRoomData.participants) * 100)}%</span>
        </div>

        {/* Support Buttons */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
            応援する（交換性なし・演出のみ）
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {mockRoomData.supportOptions.map((option) => (
              <button
                key={option.amount}
                className="py-3 px-2 rounded-lg font-semibold text-sm transition-all hover:opacity-80"
                style={{ 
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  borderRadius: 'var(--r-sm)'
                }}
              >
                ¥{option.amount.toLocaleString()}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            ※応援は配信者への支援金です。機能解放や優先権は付与されません
          </p>
        </div>

        {/* Chat - Break time only */}
        {mockRoomData.status === 'break' ? (
          <div 
            className="p-4 rounded-lg"
            style={{ background: 'var(--surface)' }}
          >
            <h3 className="text-sm font-medium mb-3">チャット（休憩中）</h3>
            <div className="space-y-2 mb-3">
              {mockRoomData.chatMessages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span style={{ color: 'var(--muted)' }}>{msg.user}</span>
                  <span className="mx-2" style={{ color: 'var(--muted)' }}>·</span>
                  <span>{msg.message}</span>
                </div>
              ))}
            </div>
            <input
              type="text"
              placeholder="メッセージを入力..."
              className="w-full p-2 rounded-lg text-sm"
              style={{ 
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}
            />
          </div>
        ) : (
          <div 
            className="p-4 rounded-lg text-center"
            style={{ background: 'var(--surface2)' }}
          >
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              チャットは休憩中のみ利用可能です
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
