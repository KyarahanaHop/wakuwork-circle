"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface PendingUser {
  id: string;
  name: string;
  nickname?: string;
  discordId: string;
  discordName: string;
  requestedAt: string;
  isFirstTime: boolean;
}

interface Participant {
  id: string;
  name: string;
  discordId: string;
  discordName: string;
  category: string | null;
  shortText: string | null;
  isCompleted: boolean;
  isMuted: boolean;
}

interface SessionInfo {
  code: string;
  status: string;
  streamerName: string;
  declaration: string | null;
  participantCount: number;
  pendingCount: number;
  passphraseRequired?: boolean;
  supportEvents?: Array<{
    id: string;
    displayName: string;
    amount: number;
    message: string | null;
    createdAt: string;
  }>;
}

interface RoomData {
  id: string;
  name: string;
  displayNameMode: string;
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

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { data: authSession, status: authStatus } = useSession();

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState("");
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [newPassphrase, setNewPassphrase] = useState("");
  const [passphraseRequired, setPassphraseRequired] = useState(true);
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [newDeclaration, setNewDeclaration] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  // Redirect if not authenticated or not a streamer
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/dashboard/${code}`);
    } else if (
      authStatus === "authenticated" &&
      !authSession?.user?.isStreamer
    ) {
      router.push("/?error=streamer_only");
    }
  }, [authStatus, authSession, code, router]);

  // Fetch room data for settings
  const fetchRoomData = useCallback(async () => {
    if (authStatus !== "authenticated" || !authSession?.user?.isStreamer)
      return;

    try {
      const res = await fetch("/api/streamer/room");
      if (!res.ok) return;
      const data = await res.json();
      setRoomData(data.room);

      if (data.room?.activeSession) {
        setPassphraseRequired(data.room.activeSession.passphraseRequired);
        setNewPassphrase(data.room.activeSession.passphrase);
        setNewDeclaration(data.room.activeSession.declaration || "");
      }
      if (data.room) {
        setApprovalRequired(data.room.approvalRequired);
      }
    } catch {
      console.error("Failed to fetch room data");
    }
  }, [authStatus, authSession]);

  // セッション情報を取得
  const fetchSessionInfo = useCallback(async () => {
    if (authStatus !== "authenticated" || !authSession?.user?.isStreamer)
      return;

    try {
      const res = await fetch(`/api/session/${code}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("セッションが見つかりません");
        } else if (res.status === 401) {
          router.push(`/login?callbackUrl=/dashboard/${code}`);
        }
        return;
      }
      const data = await res.json();
      setSessionInfo(data);
    } catch {
      console.error("Failed to fetch session info");
    } finally {
      setIsLoading(false);
    }
  }, [code, router, authStatus, authSession]);

  // 承認待ち・参加者リストを取得
  const fetchApprovalList = useCallback(async () => {
    if (authStatus !== "authenticated" || !authSession?.user?.isStreamer)
      return;

    try {
      const res = await fetch(`/api/approve?code=${code}`);
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/?error=streamer_only");
        }
        return;
      }

      const data = await res.json();
      setPendingUsers(data.pending || []);
      setParticipants(data.participants || []);
    } catch {
      console.error("Failed to fetch approval list");
    }
  }, [code, router, authStatus, authSession]);

  // 承認/拒否処理
  const handleApproval = async (
    userId: string,
    action: "approve" | "reject",
  ) => {
    setProcessingUserId(userId);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId, action }),
      });

      if (res.ok) {
        await fetchApprovalList();
        await fetchSessionInfo();
      }
    } catch {
      console.error("Failed to process approval");
    } finally {
      setProcessingUserId(null);
    }
  };

  // 一括承認
  const handleApproveAll = async () => {
    for (const user of pendingUsers) {
      await handleApproval(user.id, "approve");
    }
  };

  // 状態切替（作業中 ⇄ 休憩中）
  const handleToggleState = async () => {
    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      const res = await fetch("/api/streamer/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, toggleState: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUpdateMessage({ type: "error", text: data.error });
        return;
      }

      setUpdateMessage({
        type: "success",
        text: `${data.newState === "working" ? "作業中" : "休憩中"}に切り替えました`,
      });
      await fetchSessionInfo();
      await fetchRoomData();
    } catch {
      setUpdateMessage({ type: "error", text: "状態の切り替えに失敗しました" });
    } finally {
      setIsUpdating(false);
    }
  };

  // 設定更新
  const handleUpdateSettings = async () => {
    setIsUpdating(true);
    setUpdateMessage(null);

    // Safety lock confirmation (D-011)
    if (!passphraseRequired && !approvalRequired) {
      const confirmed = window.confirm(
        "警告: 合言葉OFF + 承認OFF の状態です。\n誰でも即入室できる状態になります。荒らし対策として推奨しません。\n\nこの設定で更新しますか？",
      );
      if (!confirmed) {
        setIsUpdating(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/streamer/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          passphrase: newPassphrase,
          passphraseRequired,
          approvalRequired,
          declaration: newDeclaration || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUpdateMessage({ type: "error", text: data.error });
        return;
      }

      if (data.warning) {
        setUpdateMessage({ type: "warning", text: data.warning });
      } else {
        setUpdateMessage({ type: "success", text: "設定を更新しました" });
      }

      await fetchSessionInfo();
      await fetchRoomData();
    } catch {
      setUpdateMessage({ type: "error", text: "設定の更新に失敗しました" });
    } finally {
      setIsUpdating(false);
    }
  };

  // セッション終了
  const handleEndSession = async () => {
    const confirmed = window.confirm(
      "セッションを終了しますか？\nこの操作は取り消せません。",
    );
    if (!confirmed) return;

    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      const res = await fetch("/api/streamer/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUpdateMessage({ type: "error", text: data.error });
        return;
      }

      // Redirect to dashboard index
      router.push("/dashboard");
    } catch {
      setUpdateMessage({
        type: "error",
        text: "セッションの終了に失敗しました",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (authStatus === "authenticated" && authSession?.user?.isStreamer) {
      fetchSessionInfo();
      fetchApprovalList();
      fetchRoomData();

      const interval = setInterval(() => {
        fetchSessionInfo();
        fetchApprovalList();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [
    fetchSessionInfo,
    fetchApprovalList,
    fetchRoomData,
    authStatus,
    authSession,
  ]);

  // 完了者数を計算
  const completedCount = participants.filter((p) => p.isCompleted).length;
  const participantCount = sessionInfo?.participantCount || participants.length;
  const completionRate =
    participantCount > 0
      ? Math.round((completedCount / participantCount) * 100)
      : 0;

  // Loading states
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

  if (isLoading) {
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
              href="/dashboard"
              className="inline-block px-4 py-2 rounded-lg"
              style={{ background: "var(--accent)", color: "white" }}
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const supportHistory = sessionInfo?.supportEvents || [];

  return (
    <main className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header
        className="flex justify-between items-center mb-6 p-4 rounded-lg"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm px-3 py-1 rounded-md transition-colors"
            style={{ background: "var(--surface2)", color: "var(--text)" }}
          >
            ← ダッシュボード
          </Link>
          <h1 className="text-lg font-semibold">
            {roomData?.name || "セッション管理"}
          </h1>
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{ background: "var(--surface2)", color: "var(--muted)" }}
          >
            {code}
          </span>
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

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Session Controls */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">状態:</span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  background:
                    sessionInfo?.status === "working"
                      ? "var(--success)"
                      : sessionInfo?.status === "break"
                        ? "var(--warning)"
                        : "var(--muted)",
                  color: "white",
                }}
              >
                {sessionInfo?.status === "working"
                  ? "作業中"
                  : sessionInfo?.status === "break"
                    ? "休憩中"
                    : "—"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleToggleState}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {sessionInfo?.status === "working" ? "休憩開始" : "作業再開"}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--surface2)", color: "var(--text)" }}
              >
                {showSettings ? "設定を閉じる" : "設定"}
              </button>
              <button
                onClick={handleEndSession}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: "var(--danger)", color: "white" }}
              >
                セッション終了
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div
              className="mt-4 pt-4 border-t space-y-4"
              style={{ borderColor: "var(--border)" }}
            >
              {updateMessage && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background:
                      updateMessage.type === "success"
                        ? "rgba(34, 197, 94, 0.1)"
                        : updateMessage.type === "warning"
                          ? "rgba(234, 179, 8, 0.1)"
                          : "rgba(239, 68, 68, 0.1)",
                    color:
                      updateMessage.type === "success"
                        ? "var(--success)"
                        : updateMessage.type === "warning"
                          ? "var(--warning)"
                          : "var(--danger)",
                  }}
                >
                  {updateMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Passphrase settings */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={passphraseRequired}
                      onChange={(e) => setPassphraseRequired(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">合言葉必須</span>
                  </label>
                  {passphraseRequired && (
                    <input
                      type="text"
                      value={newPassphrase}
                      onChange={(e) => setNewPassphrase(e.target.value)}
                      placeholder="合言葉"
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        background: "var(--surface2)",
                        borderColor: "var(--border)",
                      }}
                    />
                  )}
                </div>

                {/* Approval settings */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalRequired}
                      onChange={(e) => setApprovalRequired(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">承認制</span>
                  </label>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    OFFでも初回参加者は承認が必要です
                  </p>
                </div>
              </div>

              {/* Safety Lock Warning (D-011) */}
              {!passphraseRequired && !approvalRequired && (
                <div
                  className="p-3 rounded-lg border-2"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    borderColor: "var(--danger)",
                    color: "var(--danger)",
                  }}
                >
                  <strong>警告:</strong> 合言葉OFF + 承認OFF
                  の状態です。誰でも即入室できる状態になります。荒らし対策として推奨しません。
                </div>
              )}

              {/* Declaration */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  今日の宣言
                </label>
                <input
                  type="text"
                  value={newDeclaration}
                  onChange={(e) => setNewDeclaration(e.target.value)}
                  placeholder="今日の目標を入力"
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    background: "var(--surface2)",
                    borderColor: "var(--border)",
                  }}
                />
              </div>

              <button
                onClick={handleUpdateSettings}
                disabled={isUpdating}
                className="w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {isUpdating ? "更新中..." : "設定を保存"}
              </button>
            </div>
          )}
        </div>

        {/* 承認ロビー */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex justify-between items-center mb-3">
            <h2
              className="text-sm font-medium"
              style={{ color: "var(--muted)" }}
            >
              承認ロビー ({pendingUsers.length}人待ち)
            </h2>
            {pendingUsers.length > 1 && (
              <button
                onClick={handleApproveAll}
                className="text-sm px-3 py-1 rounded-md transition-colors"
                style={{ background: "var(--accent)", color: "white" }}
              >
                一括承認
              </button>
            )}
          </div>

          {pendingUsers.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              現在承認待ちのユーザーはいません
            </p>
          ) : (
            <div className="space-y-2">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ background: "var(--surface2)" }}
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="font-medium">{user.name}</span>
                      <span
                        className="ml-2 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        @{user.discordName}
                      </span>
                    </div>
                    {user.isFirstTime && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: "var(--accent)", color: "white" }}
                      >
                        初回
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproval(user.id, "approve")}
                      disabled={processingUserId === user.id}
                      className="px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ background: "var(--success)", color: "white" }}
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleApproval(user.id, "reject")}
                      disabled={processingUserId === user.id}
                      className="px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ background: "var(--danger)", color: "white" }}
                    >
                      拒否
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Room Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{ background: "var(--surface)" }}
          >
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              参加者
            </p>
            <p className="text-2xl font-bold">{participantCount}人</p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ background: "var(--surface)" }}
          >
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              完了率
            </p>
            <p className="text-2xl font-bold">{completionRate}%</p>
          </div>
          <div
            className="p-4 rounded-lg"
            style={{ background: "var(--surface)" }}
          >
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              承認制
            </p>
            <p className="text-2xl font-bold">
              {roomData?.approvalRequired ? "ON" : "OFF"}
            </p>
          </div>
        </div>

        {/* Current Declaration */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--surface)" }}
        >
          <h2
            className="text-sm font-medium mb-2"
            style={{ color: "var(--muted)" }}
          >
            現在の宣言
          </h2>
          <p className="text-lg">{sessionInfo?.declaration || "—"}</p>
        </div>

        {/* 参加者一覧 */}
        {participants.length > 0 && (
          <div
            className="p-4 rounded-lg"
            style={{ background: "var(--surface)" }}
          >
            <h2
              className="text-sm font-medium mb-3"
              style={{ color: "var(--muted)" }}
            >
              参加者一覧 ({participants.length}人)
              <span className="ml-2 text-xs">
                (Discord情報は配信者のみ表示)
              </span>
            </h2>
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ background: "var(--surface2)" }}
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span
                        className="ml-2 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        @{p.discordName}
                      </span>
                    </div>
                    {p.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "var(--surface)",
                          color: "var(--muted)",
                        }}
                      >
                        {p.category}
                      </span>
                    )}
                    {p.isMuted && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "var(--warning)",
                          color: "var(--text)",
                        }}
                      >
                        ミュート中
                      </span>
                    )}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color: p.isCompleted ? "var(--success)" : "var(--muted)",
                    }}
                  >
                    {p.isCompleted ? "✓ 完了" : "作業中"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supporters List (D-010: Time-ordered, no rankings/totals) */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--surface)" }}
        >
          <h2
            className="text-sm font-medium mb-3"
            style={{ color: "var(--muted)" }}
          >
            応援履歴（最新10件・時系列順）
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {supportHistory.length === 0 ? (
              <p
                className="text-sm text-center py-4"
                style={{ color: "var(--muted)" }}
              >
                まだ応援はありません
              </p>
            ) : (
              supportHistory.map((supporter) => (
                <div
                  key={supporter.id}
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ background: "var(--surface2)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {supporter.displayName}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        ¥{supporter.amount.toLocaleString()}
                      </span>
                    </div>
                    {supporter.message && (
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--muted)" }}
                      >
                        {supporter.message}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-sm ml-2 shrink-0"
                    style={{ color: "var(--muted)" }}
                  >
                    {new Date(supporter.createdAt).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            ※時系列表示のみ（煽り防止のためランキング・合計表示なし）
          </p>
        </div>

        {/* 更新情報 */}
        <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
          3秒ごとに自動更新中
        </p>
      </div>
    </main>
  );
}
