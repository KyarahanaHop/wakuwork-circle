'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function PassphrasePage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Phase 1: モック値（Phase 2でAPI取得に変更）
  const passphraseRequired = true

  useEffect(() => {
    // Phase 1: モック判定
    // Phase 2: fetch(`/api/session/${code}`) で passphraseRequired を取得
    setIsLoading(false)

    // passphraseRequired=false の場合、自動でlobbyへ遷移
    if (!passphraseRequired) {
      router.replace(`/lobby/${code}`)
    }
  }, [code, router, passphraseRequired])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedPassphrase = passphrase.trim()

    if (!trimmedPassphrase) {
      setError('合言葉を入力してください')
      return
    }

    // Phase 1: 合言葉の検証はスキップ（モック）
    // Phase 2: APIで合言葉を検証
    router.push(`/lobby/${code}`)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" 
               style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--muted)' }}>読み込み中...</p>
        </div>
      </main>
    )
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
          <h1 className="text-xl font-bold">セッション参加</h1>
        </div>
        <ThemeSwitcher />
      </header>

      <div className="max-w-md mx-auto">
        <div className="p-6 rounded-lg" style={{ background: 'var(--surface)' }}>
          {/* セッションコード表示 */}
          <div className="text-center mb-6">
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>セッションコード</p>
            <p className="text-2xl font-mono font-bold tracking-wider">{code}</p>
          </div>

          <h2 className="text-lg font-semibold mb-4 text-center">合言葉を入力</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="passphrase" 
                className="block text-sm font-medium mb-2"
              >
                合言葉
              </label>
              <input
                id="passphrase"
                type="text"
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value)
                  setError('')
                }}
                placeholder="配信者から共有された合言葉"
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
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{
                background: 'var(--accent)',
                color: 'white',
              }}
            >
              次へ
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
            このセッションには合言葉が設定されています
          </p>
        </div>
      </div>
    </main>
  )
}
