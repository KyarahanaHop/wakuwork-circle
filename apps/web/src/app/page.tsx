'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function JoinPage() {
  const router = useRouter()
  const [sessionCode, setSessionCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isValidCode = (code: string): boolean => {
    return /^[A-Za-z0-9]{6,8}$/.test(code)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedCode = sessionCode.trim().toUpperCase()

    if (!trimmedCode) {
      setError('セッションコードを入力してください')
      return
    }

    if (!isValidCode(trimmedCode)) {
      setError('セッションコードは英数字6〜8桁で入力してください')
      return
    }

    setIsLoading(true)

    try {
      // セッション存在確認
      const res = await fetch(`/api/session/${trimmedCode}`)
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('セッションが見つかりません')
        } else {
          setError('エラーが発生しました')
        }
        return
      }

      // セッションが存在する場合、合言葉画面へ遷移
      router.push(`/join/${trimmedCode}`)
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-6">
      <header className="flex justify-between items-center mb-8 p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
        <h1 className="text-2xl font-bold">WakuWork Circle</h1>
        <ThemeSwitcher />
      </header>

      <div className="max-w-md mx-auto">
        <div className="p-6 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h2 className="text-xl font-semibold mb-6 text-center">セッションに参加</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="sessionCode" 
                className="block text-sm font-medium mb-2"
              >
                セッションコード
              </label>
              <input
                id="sessionCode"
                type="text"
                value={sessionCode}
                onChange={(e) => {
                  setSessionCode(e.target.value)
                  setError('')
                }}
                placeholder="例: ABC123"
                maxLength={8}
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                style={{
                  background: 'var(--surface2)',
                  borderColor: error ? 'var(--danger)' : 'transparent',
                }}
                autoComplete="off"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm" style={{ color: 'var(--danger)' }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'var(--accent)',
                color: 'white',
              }}
            >
              {isLoading ? '確認中...' : '参加する'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
            配信者から共有されたセッションコードを入力してください
          </p>
        </div>

        {/* コンセプト説明（小さく） */}
        <div className="mt-6 p-4 rounded-lg text-sm" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
          <p className="mb-2 font-medium" style={{ color: 'var(--foreground)' }}>WakuWork Circleとは</p>
          <ul className="space-y-1">
            <li>・配信者と視聴者が一緒に作業する同席作業空間</li>
            <li>・応援は返礼なし、演出のみ（交換性禁止）</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
