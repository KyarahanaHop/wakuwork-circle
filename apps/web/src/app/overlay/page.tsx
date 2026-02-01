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
    <main className="min-h-screen p-4 obs-transparent">
      {/* Minimal header with back link */}
      <div className="mb-4">
        <Link 
          href="/"
          className="text-sm px-3 py-1 rounded-md transition-colors inline-block"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
        >
          ← 戻る
        </Link>
      </div>

      {/* OBS Overlay Content - Transparent background */}
      <div className="space-y-3">
        {/* Stats Bar */}
        <div 
          className="flex items-center gap-4 p-3 rounded-lg"
          style={{ 
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-70">参加者</span>
            <span className="text-xl font-bold">{mockOverlayData.participants}</span>
          </div>
          <div className="w-px h-6 bg-white/30" />
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-70">完了</span>
            <span className="text-xl font-bold">
              {Math.round((mockOverlayData.completed / mockOverlayData.participants) * 100)}%
            </span>
          </div>
        </div>

        {/* Latest Support */}
        <div 
          className="p-3 rounded-lg"
          style={{ 
            background: 'rgba(37, 99, 235, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(4px)'
          }}
        >
          <p className="text-xs opacity-70 mb-1">最新の応援</p>
          <p className="font-semibold">
            {mockOverlayData.latestSupport.name}さんが
            ¥{mockOverlayData.latestSupport.amount.toLocaleString()}
            で応援！
          </p>
        </div>
      </div>

      {/* Usage Note */}
      <div className="mt-8 p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
        <h2 className="font-semibold mb-2">OBSでの使用方法</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
          <li>OBSで「ブラウザ」ソースを追加</li>
          <li>URLに「http://localhost:3000/overlay」を入力</li>
          <li>幅: 400px、高さ: 200px程度を推奨</li>
          <li>背景透過を有効にする</li>
        </ol>
      </div>
    </main>
  );
}
