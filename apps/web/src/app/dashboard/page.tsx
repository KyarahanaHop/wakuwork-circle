"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

type DisplayNameMode = "nickname" | "animal" | "anonymous";

interface RoomData {
  id: string;
  name: string;
  displayNameMode: DisplayNameMode;
  approvalRequired: boolean;
  activeSession: {
    code: string;
    passphrase: string;
    passphraseRequired: boolean;
    state: string;
    declaration: string | null;
    startedAt: string;
    memberCount: number;
    pendingCount: number;
  } | null;
}

export default function DashboardIndexPage() {
  const router = useRouter();
  const { data: authSession, status: authStatus } = useSession();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Room creation form state
  const [roomName, setRoomName] = useState("");
  const [displayNameMode, setDisplayNameMode] =
    useState<DisplayNameMode>("nickname");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Session start form state
  const [passphrase, setPassphrase] = useState("");
  const [passphraseRequired, setPassphraseRequired] = useState(true);
  const [declaration, setDeclaration] = useState("");
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Redirect if not authenticated or not a streamer
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    } else if (
      authStatus === "authenticated" &&
      !authSession?.user?.isStreamer
    ) {
      router.push("/?error=streamer_only");
    }
  }, [authStatus, authSession, router]);

  // Fetch room data
  useEffect(() => {
    async function fetchRoom() {
      if (authStatus !== "authenticated" || !authSession?.user?.isStreamer)
        return;

      try {
        const res = await fetch("/api/streamer/room");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login?callbackUrl=/dashboard");
            return;
          }
          throw new Error("Failed to fetch room");
        }

        const data = await res.json();
        setRoom(data.room);
        setSafetyWarning(data.safetyWarning || null);

        // If there's an active session, redirect to dashboard/[code]
        if (data.room?.activeSession) {
          router.push(`/dashboard/${data.room.activeSession.code}`);
        }
      } catch (err) {
        console.error("Failed to fetch room:", err);
        setError("ルーム情報の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoom();
  }, [authStatus, authSession, router]);

  // Create room handler
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingRoom(true);
    setError("");

    try {
      const res = await fetch("/api/streamer/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName.trim(),
          displayNameMode,
          approvalRequired,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ルームの作成に失敗しました");
        return;
      }

      // Refresh room data
      const roomRes = await fetch("/api/streamer/room");
      const roomData = await roomRes.json();
      setRoom(roomData.room);
    } catch {
      setError("ルームの作成に失敗しました");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Start session handler
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStartingSession(true);
    setError("");

    // Safety lock check (D-011)
    if (!passphraseRequired && !room?.approvalRequired) {
      const confirmed = window.confirm(
        "警告: 合言葉OFF + 承認OFF の状態です。\n誰でも即入室できる状態になります。荒らし対策として推奨しません。\n\nこの設定で開始しますか？",
      );
      if (!confirmed) {
        setIsStartingSession(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/streamer/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passphrase: passphrase.trim(),
          passphraseRequired,
          declaration: declaration.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "セッションの開始に失敗しました");
        return;
      }

      // Redirect to dashboard/[code]
      router.push(`/dashboard/${data.sessionCode}`);
    } catch {
      setError("セッションの開始に失敗しました");
    } finally {
      setIsStartingSession(false);
    }
  };

  // Loading states
  if (authStatus === "loading" || isLoading) {
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
          <p style={{ color: "var(--muted)" }}>読み込み中...</p>
        </div>
      </main>
    );
  }

  if (
    authStatus === "unauthenticated" ||
    (authStatus === "authenticated" && !authSession?.user?.isStreamer)
  ) {
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
          <p style={{ color: "var(--muted)" }}>リダイレクト中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header
        className="flex justify-between items-center mb-6 p-4 rounded-lg"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm px-3 py-1 rounded-md transition-colors"
            style={{ background: "var(--surface2)", color: "var(--text)" }}
          >
            ← 戻る
          </Link>
          <h1 className="text-lg font-semibold">配信者ダッシュボード</h1>
        </div>
        <div className="flex items-center gap-3">
          {authSession?.user && (
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {authSession.user.discordName || authSession.user.name}
            </span>
          )}
          <ThemeSwitcher />
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Error display */}
        {error && (
          <div
            className="p-4 rounded-lg mb-4"
            style={{ background: "var(--danger)", color: "white" }}
          >
            {error}
          </div>
        )}

        {/* Safety warning */}
        {safetyWarning && (
          <div
            className="p-4 rounded-lg mb-4 border-2"
            style={{
              background: "var(--danger-soft)",
              borderColor: "var(--danger)",
              color: "var(--danger)",
            }}
          >
            <strong>警告:</strong> {safetyWarning}
          </div>
        )}

        {/* Room not created yet */}
        {!room && (
          <div
            className="p-6 rounded-lg"
            style={{ background: "var(--surface)" }}
          >
            <h2 className="text-xl font-semibold mb-4">ルームを作成</h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              最初にルームを作成してください。MVPでは1配信者につき1ルームまでです。
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  ルーム名 <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="例: 〇〇の作業部屋"
                  maxLength={50}
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    background: "var(--surface2)",
                    borderColor: "var(--border)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  表示名モード
                </label>
                <select
                  value={displayNameMode}
                  onChange={(e) =>
                    setDisplayNameMode(e.target.value as DisplayNameMode)
                  }
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    background: "var(--surface2)",
                    borderColor: "var(--border)",
                  }}
                >
                  <option value="nickname">ニックネーム</option>
                  <option value="animal">動物名（セッション内固定）</option>
                  <option value="anonymous">匿名（参加者#N）</option>
                </select>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  視聴者の表示名の形式を選択します
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approvalRequired}
                    onChange={(e) => setApprovalRequired(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">承認制にする</span>
                </label>
                <p
                  className="text-xs mt-1 ml-6"
                  style={{ color: "var(--muted)" }}
                >
                  ONの場合、参加者は配信者の承認が必要になります
                </p>
              </div>

              <button
                type="submit"
                disabled={isCreatingRoom || !roomName.trim()}
                className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {isCreatingRoom ? "作成中..." : "ルームを作成"}
              </button>
            </form>
          </div>
        )}

        {/* Room exists, no active session */}
        {room && !room.activeSession && (
          <div
            className="p-6 rounded-lg"
            style={{ background: "var(--surface)" }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{room.name}</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                表示名モード:{" "}
                {room.displayNameMode === "nickname"
                  ? "ニックネーム"
                  : room.displayNameMode === "animal"
                    ? "動物名"
                    : "匿名"}{" "}
                / 承認制: {room.approvalRequired ? "ON" : "OFF"}
              </p>
            </div>

            <h3 className="text-lg font-semibold mb-4">セッションを開始</h3>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={passphraseRequired}
                    onChange={(e) => setPassphraseRequired(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    合言葉を必須にする
                  </span>
                </label>

                {passphraseRequired && (
                  <input
                    type="text"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="合言葉を入力"
                    required={passphraseRequired}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      background: "var(--surface2)",
                      borderColor: "var(--border)",
                    }}
                  />
                )}

                {/* Safety lock warning (D-011) */}
                {!passphraseRequired && !room.approvalRequired && (
                  <div
                    className="p-3 rounded-lg mt-2 border-2"
                    style={{
                      background: "var(--danger-soft)",
                      borderColor: "var(--danger)",
                      color: "var(--danger)",
                    }}
                  >
                    <strong>警告:</strong> 合言葉OFF + 承認OFF
                    の状態です。誰でも即入室できる状態になります。荒らし対策として推奨しません。
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  今日の宣言（任意）
                </label>
                <input
                  type="text"
                  value={declaration}
                  onChange={(e) => setDeclaration(e.target.value)}
                  placeholder="例: 今日は3時間集中して〇〇を完成させる！"
                  maxLength={100}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    background: "var(--surface2)",
                    borderColor: "var(--border)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={
                  isStartingSession ||
                  (passphraseRequired && !passphrase.trim())
                }
                className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {isStartingSession ? "開始中..." : "セッションを開始"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
