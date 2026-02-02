"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration:
      "サーバー設定に問題があります。管理者にお問い合わせください。",
    AccessDenied:
      "アクセスが拒否されました。このサービスを利用する権限がありません。",
    Verification: "認証トークンの検証に失敗しました。もう一度お試しください。",
    OAuthSignin: "Discordログインの開始に失敗しました。",
    OAuthCallback: "Discordからの応答処理に失敗しました。",
    OAuthCreateAccount: "アカウントの作成に失敗しました。",
    EmailCreateAccount: "メールアカウントの作成に失敗しました。",
    Callback: "認証コールバックでエラーが発生しました。",
    OAuthAccountNotLinked: "このメールは別の認証方法でリンクされています。",
    SessionRequired: "この操作にはログインが必要です。",
    Default: "認証中にエラーが発生しました。",
  };

  const message = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="max-w-md w-full mx-4">
        <div className="card-base p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            認証エラー
          </h1>

          <p className="text-[var(--color-text-secondary)] mb-6">{message}</p>

          {error && (
            <p className="text-sm text-[var(--color-text-tertiary)] mb-6">
              エラーコード: {error}
            </p>
          )}

          <div className="space-y-3">
            <a
              href="/login"
              className="btn-primary w-full inline-block text-center py-3"
            >
              ログインページに戻る
            </a>
            <a
              href="/"
              className="text-[var(--color-primary)] hover:underline block"
            >
              トップページへ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
          <div className="text-[var(--color-text-secondary)]">
            読み込み中...
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
