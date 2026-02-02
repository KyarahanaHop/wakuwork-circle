'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function LobbyPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  // Phase 1: モックデータ（Phase 2でAPI取得に変更）
  const streamer = {
    name: '配信者さん',
    icon: '👤',
  }

  const handleCancel = () => {
    router.push('/')
  }

  // Phase 1: 仮の「承認されたらRoomへ」ボタン（Phase 2で自動化）
  const handleMockApprove = () => {
    router.push(`/room/${code}`)
  }

  return (
    <main className="min-h-screen p-6">
      <header className="flex justify-between items-center mb-8 p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="text-sm hover:opacity-80 transition-opacity"
            style={{ color: 'var(--muted)' }}
          >
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold">ロビー</h1>
        </div>
        <ThemeSwitcher />
      </header>

      <div className="max-w-md mx-auto">
        <div className="p-8 rounded-lg text-center" style={{ background: 'var(--surface)' }}>
          {/* 配信者情報 */}
          <div className="mb-8">
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{ background: 'var(--surface2)' }}
            >
              {streamer.icon}
            </div>
            <p className="text-lg font-semibold">{streamer.name}のルーム</p>
            <p className="text-sm mt-1 font-mono" style={{ color: 'var(--muted)' }}>
              セッション: {code}
            </p>
          </div>

          {/* 承認待ち表示 */}
          <div 
            className="p-6 rounded-lg mb-6"
            style={{ background: 'var(--surface2)' }}
          >
            <p className="text-lg mb-4">承認を待っています...</p>
            
            {/* スピナー */}
            <div 
              className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full mx-auto"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
            
            <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
              配信者があなたの参加を承認するまでお待ちください
            </p>
          </div>

          {/* Phase 1: 仮のボタン（開発用） */}
          <div className="space-y-3">
            <button
              onClick={handleMockApprove}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{
                background: 'var(--accent)',
                color: 'white',
              }}
            >
              承認されたらRoomへ（開発用）
            </button>

            <button
              onClick={handleCancel}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{
                background: 'var(--surface2)',
              }}
            >
              キャンセル
            </button>
          </div>
        </div>

        {/* 補足 */}
        <p className="mt-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
          初回参加時は承認が必要です
        </p>
      </div>
    </main>
  )
}
