import Link from 'next/link'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <header className="flex justify-between items-center mb-8 p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
        <h1 className="text-2xl font-bold">WakuWork Circle</h1>
        <ThemeSwitcher />
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="p-6 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h2 className="text-xl font-semibold mb-4">画面一覧</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/room"
              className="p-4 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'var(--surface2)' }}
            >
              <h3 className="font-semibold mb-2">Room（視聴者）</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                作業セッションの参加・応援
              </p>
            </Link>
            
            <Link 
              href="/dashboard"
              className="p-4 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'var(--surface2)' }}
            >
              <h3 className="font-semibold mb-2">Dashboard（配信者）</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                セッション管理・分析
              </p>
            </Link>
            
            <Link 
              href="/overlay"
              className="p-4 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'var(--surface2)' }}
            >
              <h3 className="font-semibold mb-2">OBS Overlay</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                配信用オーバーレイ表示
              </p>
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h2 className="text-xl font-semibold mb-4">コンセプト</h2>
          <ul className="space-y-2" style={{ color: 'var(--muted)' }}>
            <li>・同席作業：配信者と視聴者が一緒に作業する空間</li>
            <li>・応援（返礼なし）：300/500/1000/3000円のプリセットから選択</li>
            <li>・交換性禁止：応援で機能解放・優先権は与えない（演出のみ）</li>
            <li>・治安UI強制：初見制限、通報/ブロック導線、休憩時のみチャット</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
