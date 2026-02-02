'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

interface SessionInfo {
  code: string
  passphraseRequired: boolean
  streamerName: string
  status: string
}

export default function PassphrasePage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)

  // 参加リクエストを送信
  const submitJoinRequest = useCallback(async (passphraseValue: string) => {
    setIsSubmitting(true)
    setError('')

    try {
      // ユーザーIDを取得または生成（実際はOAuth認証から）
      let userId = localStorage.getItem('wakuwork_user_id')
      if (!userId) {
        userId = `user_${Date.now()}`
        localStorage.setItem('wakuwork_user_id', userId)
      }

      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          passphrase: passphraseValue,
          userId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '参加に失敗しました')
        return
      }

      // 成功時: userIdを保存
      localStorage.setItem('wakuwork_user_id', data.userId)
      
      // 既に承認済みならRoomへ直接遷移、そうでなければLobbyへ
      if (data.alreadyApproved) {
        router.push(`/room/${code}`)
      } else {
        router.push(`/lobby/${code}`)
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }, [code, router])

  // セッション情報を取得
  const fetchSessionInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/session/${code}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('セッションが見つかりません')
          return
        }
        throw new Error('Failed to fetch session')
      }
      
      const data = await res.json()
      setSessionInfo(data)
      
      // 合言葉不要の場合、直接参加リクエストを送信
      if (!data.passphraseRequired) {
        await submitJoinRequest('')
      }
    } catch {
      setError('セッション情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [code, submitJoinRequest])

  useEffect(() => {
    fetchSessionInfo()
  }, [fetchSessionInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedPassphrase = passphrase.trim()
    if (!trimmedPassphrase && sessionInfo?.passphraseRequired) {
      setError('合言葉を入力してください')
      return
    }

    await submitJoinRequest(trimmedPassphrase)
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

  // エラー時（セッション見つからない等）
  if (error && !sessionInfo) {
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
    )
  }

  // 合言葉不要の場合は自動でlobbyへ遷移中
  if (sessionInfo && !sessionInfo.passphraseRequired) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" 
               style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--muted)' }}>参加リクエスト中...</p>
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
          {/* セッション情報 */}
          <div className="text-center mb-6">
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>セッションコード</p>
            <p className="text-2xl font-mono font-bold tracking-wider">{code}</p>
            {sessionInfo && (
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                {sessionInfo.streamerName}のルーム
              </p>
            )}
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
                disabled={isSubmitting}
              />
              {error && (
                <p className="mt-2 text-sm" style={{ color: 'var(--danger)' }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'var(--accent)',
                color: 'white',
              }}
            >
              {isSubmitting ? '送信中...' : '次へ'}
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
