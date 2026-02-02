"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface SessionInfo {
  code: string;
  streamerName: string;
  status: string;
  userApprovalStatus?: "pending" | "approved" | "rejected" | "member";
}

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { data: session, status: authStatus } = useSession();

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState("");
  const [isRejected, setIsRejected] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/join/${code}`);
    }
  }, [authStatus, code, router]);

  // ポーリングで承認状態を確認
  const checkApprovalStatus = useCallback(async () => {
    if (authStatus !== "authenticated") return;

    try {
      const res = await fetch(`/api/session/${code}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("セッションが見つかりません");
        }
        return;
      }

      const data: SessionInfo = await res.json();
      setSessionInfo(data);

      // 承認状態をチェック
      if (
        data.userApprovalStatus === "approved" ||
        data.userApprovalStatus === "member"
      ) {
        // 承認された！Roomへ遷移
        router.push(`/room/${code}`);
      } else if (data.userApprovalStatus === "rejected") {
        // 拒否された
        setIsRejected(true);
      }
    } catch {
      console.error("Failed to check approval status");
    }
  }, [code, router, authStatus]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    // 初回チェック
    checkApprovalStatus();

    // 5秒間隔でポーリング
    const interval = setInterval(checkApprovalStatus, 5000);

    return () => clearInterval(interval);
  }, [checkApprovalStatus, authStatus]);

  const handleCancel = () => {
    router.push("/");
  };

  // Loading auth state
  if (authStatus === "loading") {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{
              borderColor: "var(--accent)",
              borderTopColor: "transparent",
            }}
          />
          <p style={{ color: "var(--muted)" }}>認証確認中...</p>
        </div>
      </main>
    );
  }

  // Redirecting to login
  if (authStatus === "unauthenticated") {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{
              borderColor: "var(--accent)",
              borderTopColor: "transparent",
            }}
          />
          <p style={{ color: "var(--muted)" }}>ログインページへ移動中...</p>
        </div>
      </main>
    );
  }

  // 拒否された場合
  if (isRejected) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-md mx-auto text-center">
          <div
            className="p-8 rounded-lg"
            style={{ background: "var(--surface)" }}
          >
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-xl font-semibold mb-4">参加が拒否されました</h2>
            <p className="mb-6" style={{ color: "var(--muted)" }}>
              配信者によって参加リクエストが拒否されました。
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg font-semibold"
              style={{ background: "var(--accent)", color: "white" }}
            >
              トップに戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // エラー表示
  if (error) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-md mx-auto text-center">
          <div
            className="p-6 rounded-lg"
            style={{ background: "var(--surface)" }}
          >
            <p className="text-lg mb-4" style={{ color: "var(--danger)" }}>
              {error}
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-lg"
              style={{ background: "var(--accent)", color: "white" }}
            >
              トップに戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <header
        className="flex justify-between items-center mb-8 p-4 rounded-lg"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm hover:opacity-80 transition-opacity"
            style={{ color: "var(--muted)" }}
          >
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold">ロビー</h1>
        </div>
        <div className="flex items-center gap-3">
          {session?.user && (
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {session.user.discordName || session.user.name}
            </span>
          )}
          <ThemeSwitcher />
        </div>
      </header>

      <div className="max-w-md mx-auto">
        <div
          className="p-8 rounded-lg text-center"
          style={{ background: "var(--surface)" }}
        >
          {/* 配信者情報 */}
          <div className="mb-8">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{ background: "var(--surface2)" }}
            >
              👤
            </div>
            <p className="text-lg font-semibold">
              {sessionInfo?.streamerName || "配信者"}のルーム
            </p>
            <p
              className="text-sm mt-1 font-mono"
              style={{ color: "var(--muted)" }}
            >
              セッション: {code}
            </p>
          </div>

          {/* 承認待ち表示 */}
          <div
            className="p-6 rounded-lg mb-6"
            style={{ background: "var(--surface2)" }}
          >
            <p className="text-lg mb-4">承認を待っています...</p>

            {/* スピナー */}
            <div
              className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full mx-auto"
              style={{
                borderColor: "var(--accent)",
                borderTopColor: "transparent",
              }}
            />

            <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
              配信者があなたの参加を承認するまでお待ちください
            </p>
          </div>

          {/* ボタン */}
          <div className="space-y-3">
            <button
              onClick={handleCancel}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{
                background: "var(--surface2)",
              }}
            >
              キャンセル
            </button>
          </div>
        </div>

        {/* 補足 */}
        <p
          className="mt-4 text-center text-sm"
          style={{ color: "var(--muted)" }}
        >
          初回参加時は承認が必要です（5秒ごとに自動確認中）
        </p>
      </div>
    </main>
  );
}
