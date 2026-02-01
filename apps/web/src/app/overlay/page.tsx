'use client';

import Link from 'next/link';

// モックデータ
const mockOverlayData = {
  participants: 12,
  completed: 8,
  latestSupport: {
    name: 'ユーザーA',
    amount: 1000,
  },
};

export default function OverlayPage() {
  return (
    <main className="min-h-screen p-4">
      {/* Minimal header with back link - overlay専用トークン使用 */}
      <div className="mb-4">
        <Link 
          href="/"
          className="text-sm px-3 py-1 rounded-md transition-colors inline-block"
          style={{ 
            background: 'var(--overlay-surface)', 
            color: 'var(--overlay-text)',
            borderRadius: 'var(--r-md)'
          }}
        >
          ← 戻る
        </Link>
      </div>

      {/* OBS Overlay Content - Transparent background */}
      <div className="space-y-3">
        {/* Stats Bar - overlayトークン使用 */}
        <div 
          className="flex items-center gap-4 p-3"
          style={{ 
            background: 'var(--overlay-surface)',
            color: 'var(--overlay-text)',
            borderRadius: 'var(--r-md)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--overlay-muted)' }}>参加者</span>
            <span className="text-xl font-bold">{mockOverlayData.participants}</span>
          </div>
          <div 
            className="w-px h-6" 
            style={{ background: 'var(--overlay-muted)' }} 
          />
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--overlay-muted)' }}>完了</span>
            <span className="text-xl font-bold">
              {Math.round((mockOverlayData.completed / mockOverlayData.participants) * 100)}%
            </span>
          </div>
        </div>

        {/* Latest Support - overlayトークン使用 */}
        <div 
          className="p-3"
          style={{ 
            background: 'var(--overlay-surface)',
            color: 'var(--overlay-text)',
            borderRadius: 'var(--r-md)',
            border: '2px solid var(--primary)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--overlay-muted)' }}>最新の応援</p>
          <p className="font-semibold">
            {mockOverlayData.latestSupport.name}さんが
            ¥{mockOverlayData.latestSupport.amount.toLocaleString()}
            で応援！
          </p>
        </div>
      </div>

      {/* Usage Note - 通常トークン使用（配信者向け説明なので） */}
      <div 
        className="mt-8 p-4" 
        style={{ 
          background: 'var(--surface)',
          borderRadius: 'var(--r-md)'
        }}
      >
        <h2 className="font-semibold mb-2">OBSでの使用方法</h2>
        <ol 
          className="list-decimal list-inside space-y-1 text-sm" 
          style={{ color: 'var(--muted)' }}
        >
          <li>OBSで「ブラウザ」ソースを追加</li>
          <li>URLに「http://localhost:3000/overlay」を入力</li>
          <li>幅: 400px、高さ: 200px程度を推奨</li>
          <li>背景透過を有効にする</li>
        </ol>
      </div>
    </main>
  );
}
