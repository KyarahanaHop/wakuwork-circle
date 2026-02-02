"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

// SSoT準拠: 作業カテゴリ（6種）
const WORK_CATEGORIES = [
  { id: "practice", label: "練習" },
  { id: "study", label: "勉強" },
  { id: "create", label: "制作" },
  { id: "work", label: "作業" },
  { id: "break", label: "休憩" },
  { id: "other", label: "その他" },
] as const;

type CategoryId = (typeof WORK_CATEGORIES)[number]["id"];

// SSoT準拠: スタンプ（4種固定）
const STAMPS = [
  { id: "wave", emoji: "👋", label: "挨拶" },
  { id: "like", emoji: "👍", label: "いいね" },
  { id: "alert", emoji: "❗", label: "！" },
  { id: "sleepy", emoji: "😴", label: "眠い" },
] as const;

type StampId = (typeof STAMPS)[number]["id"];

// Session info from API
interface SessionData {
  code: string;
  status: "working" | "break" | "ended";
  streamerName: string;
  declaration: string | null;
  participantCount: number;
  startedAt: string;
  userApprovalStatus?: string;
  myStatus?: {
    category: string | null;
    shortText: string | null;
    isCompleted: boolean;
    displayName: string;
  };
  supportEvents?: Array<{
    id: string;
    displayName: string;
    amount: number;
    message: string | null;
    createdAt: string;
  }>;
}

// スタンプレート制限フック（2秒間隔）+ cleanup対応
function useStampRateLimit(cooldownMs: number = 2000) {
  const lastStampTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  // cleanup: アンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const canSendStamp = useCallback(() => {
    const now = Date.now();
    return now - lastStampTime.current >= cooldownMs;
  }, [cooldownMs]);

  const sendStamp = useCallback(
    (stampId: StampId, onSend: (id: StampId) => void) => {
      if (!canSendStamp()) {
        return false;
      }
      lastStampTime.current = Date.now();
      setIsOnCooldown(true);
      onSend(stampId);

      // 既存タイマーをクリアしてから新しいタイマーをセット
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsOnCooldown(false);
        timeoutRef.current = null;
      }, cooldownMs);

      return true;
    },
    [canSendStamp, cooldownMs],
  );

  return { sendStamp, isOnCooldown, canSendStamp };
}

// Calculate elapsed time from startedAt
function useElapsedTime(startedAt: string | null) {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    if (!startedAt) return;

    const startTime = new Date(startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setElapsed(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { data: authSession, status: authStatus } = useSession();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryId>("practice");
  const [shortText, setShortText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { sendStamp, isOnCooldown } = useStampRateLimit(2000);

  // Stamp display state
  const [displayedStamps, setDisplayedStamps] = useState<
    Array<{
      id: string;
      stampType: StampId;
      displayName: string;
      createdAt: string;
      key: string; // Unique key for animation
    }>
  >([]);
  const lastStampTimestampRef = useRef<string | null>(null);
  const [stampError, setStampError] = useState<string | null>(null);

  // Pending updates queue for handling rapid changes
  const pendingUpdateRef = useRef<{
    category?: CategoryId;
    shortText?: string;
    isCompleted?: boolean;
  } | null>(null);
  const isUpdatingRef = useRef(false);

  const elapsedTime = useElapsedTime(sessionData?.startedAt || null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/join/${code}`);
    }
  }, [authStatus, code, router]);

  // Fetch session data
  const fetchSessionData = useCallback(async () => {
    if (authStatus !== "authenticated") return;

    try {
      const res = await fetch(`/api/session/${code}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("セッションが見つかりません");
        } else if (res.status === 401) {
          router.push(`/login?callbackUrl=/join/${code}`);
        }
        return;
      }

      const data = await res.json();

      // Check if user is approved
      if (
        data.userApprovalStatus !== "member" &&
        data.userApprovalStatus !== "approved"
      ) {
        // Not approved yet, redirect to lobby
        router.push(`/lobby/${code}`);
        return;
      }

      setSessionData(data);

      // Initialize from myStatus only once
      if (!hasInitialized && data.myStatus) {
        if (data.myStatus.category) {
          setSelectedCategory(data.myStatus.category as CategoryId);
        }
        if (data.myStatus.shortText) {
          setShortText(data.myStatus.shortText);
        }
        setIsCompleted(data.myStatus.isCompleted);
        setHasInitialized(true);
      }

      setIsLoading(false);
    } catch {
      setError("セッション情報の取得に失敗しました");
    }
  }, [code, router, authStatus, hasInitialized]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchSessionData();

      // Poll every 5 seconds for updates
      const interval = setInterval(fetchSessionData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchSessionData, authStatus]);

  // Send stamp to API
  const handleStampClick = (stampId: StampId) => {
    sendStamp(stampId, async (id) => {
      setStampError(null);
      try {
        const res = await fetch("/api/stamp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, stampType: id }),
        });

        if (!res.ok) {
          const data = await res.json();
          setStampError(data.error || "スタンプの送信に失敗しました");
          // Clear error after 3 seconds
          setTimeout(() => setStampError(null), 3000);
        }
      } catch (err) {
        console.error("Failed to send stamp:", err);
        setStampError("スタンプの送信に失敗しました");
        setTimeout(() => setStampError(null), 3000);
      }
    });
  };

  // Poll for stamps
  const fetchStamps = useCallback(async () => {
    if (authStatus !== "authenticated") return;

    try {
      const url = new URL(
        `/api/session/${code}/stamps`,
        window.location.origin,
      );
      if (lastStampTimestampRef.current) {
        url.searchParams.set("since", lastStampTimestampRef.current);
      }

      const res = await fetch(url.toString());
      if (!res.ok) return;

      const data = await res.json();

      if (data.stamps && data.stamps.length > 0) {
        // Add new stamps with unique keys for animation
        const newStamps = data.stamps.map(
          (s: {
            id: string;
            stampType: StampId;
            displayName: string;
            createdAt: string;
          }) => ({
            ...s,
            key: `${s.id}-${Date.now()}`,
          }),
        );
        setDisplayedStamps((prev) => [...prev, ...newStamps]);
        lastStampTimestampRef.current = data.lastTimestamp;

        // Remove stamps after 5 seconds (animation duration)
        setTimeout(() => {
          setDisplayedStamps((prev) =>
            prev.filter(
              (s) => !newStamps.some((n: { key: string }) => n.key === s.key),
            ),
          );
        }, 5000);
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [code, authStatus]);

  // Stamp polling effect
  useEffect(() => {
    if (authStatus === "authenticated" && sessionData) {
      // Initial fetch
      fetchStamps();

      // Poll every 2 seconds for stamps
      const interval = setInterval(fetchStamps, 2000);
      return () => clearInterval(interval);
    }
  }, [fetchStamps, authStatus, sessionData]);

  // API call to update member status (with queue for rapid changes)
  const updateStatus = useCallback(
    async (updates: {
      category?: CategoryId;
      shortText?: string;
      isCompleted?: boolean;
    }) => {
      // If already updating, queue this update (merge with pending)
      if (isUpdatingRef.current) {
        pendingUpdateRef.current = {
          ...pendingUpdateRef.current,
          ...updates,
        };
        return;
      }

      isUpdatingRef.current = true;
      setIsUpdating(true);

      try {
        const res = await fetch("/api/member/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, ...updates }),
        });

        if (!res.ok) {
          const data = await res.json();
          console.error("Failed to update status:", data.error);
        }
      } catch (err) {
        console.error("Failed to update status:", err);
      } finally {
        isUpdatingRef.current = false;
        setIsUpdating(false);

        // Process pending update if exists
        if (pendingUpdateRef.current) {
          const pending = pendingUpdateRef.current;
          pendingUpdateRef.current = null;
          // Use setTimeout to avoid potential infinite loop in same tick
          setTimeout(() => updateStatus(pending), 0);
        }
      }
    },
    [code],
  );

  const handleShortTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setShortText(value);
    }
  };

  // Short text blur handler - send to API when focus leaves
  const handleShortTextBlur = () => {
    updateStatus({ shortText });
  };

  // Category change handler
  const handleCategoryChange = (category: CategoryId) => {
    setSelectedCategory(category);
    updateStatus({ category });
  };

  // 完了ボタンのトグル処理
  const handleCompleteToggle = () => {
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    updateStatus({ isCompleted: newCompleted });
  };

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

  if (!sessionData) return null;

  const supportHistory = sessionData.supportEvents || [];

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
            ← 退出
          </Link>
          <h1 className="text-lg font-semibold">
            {sessionData.streamerName}の部屋
          </h1>
          <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
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

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Status & Timer */}
        <div
          className="p-4 rounded-lg flex justify-between items-center"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                background:
                  sessionData.status === "working"
                    ? "var(--primary)"
                    : "var(--warning)",
                color:
                  sessionData.status === "working"
                    ? "var(--primaryText)"
                    : "var(--text)",
              }}
            >
              {sessionData.status === "working"
                ? "作業中"
                : sessionData.status === "break"
                  ? "休憩中"
                  : "終了"}
            </span>
            <span style={{ color: "var(--muted)" }}>
              参加者: {sessionData.participantCount}人
            </span>
          </div>
          <span className="text-3xl font-mono font-bold">{elapsedTime}</span>
        </div>

        {/* Declaration */}
        <div
          className="p-6 rounded-lg"
          style={{ background: "var(--surface)" }}
        >
          <h2
            className="text-sm font-medium mb-2"
            style={{ color: "var(--muted)" }}
          >
            今回の宣言
          </h2>
          <p
            className="text-lg font-medium"
            style={{ color: "var(--primary)" }}
          >
            {sessionData.declaration || "—"}
          </p>
        </div>

        {/* Your Work Status - Category & Short Text */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--surface)" }}
        >
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: "var(--muted)" }}
          >
            あなたの作業
          </h3>

          {/* Category Selection */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {WORK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    background:
                      selectedCategory === cat.id
                        ? "var(--primary)"
                        : "var(--surface2)",
                    color:
                      selectedCategory === cat.id
                        ? "var(--primaryText)"
                        : "var(--text)",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Short Text Input */}
          <div className="relative">
            <input
              type="text"
              value={shortText}
              onChange={handleShortTextChange}
              onBlur={handleShortTextBlur}
              placeholder="今やっていることを短文で..."
              className="w-full p-2 pr-12 rounded-lg text-sm"
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
              style={{
                color: shortText.length >= 45 ? "var(--error)" : "var(--muted)",
              }}
            >
              {shortText.length}/50
            </span>
          </div>
        </div>

        {/* Stamps */}
        <div
          className="p-4 rounded-lg relative"
          style={{ background: "var(--surface)" }}
        >
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: "var(--muted)" }}
          >
            スタンプ
            {isOnCooldown && (
              <span
                className="ml-2 text-xs"
                style={{ color: "var(--warning)" }}
              >
                (クールダウン中...)
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            {STAMPS.map((stamp) => (
              <button
                key={stamp.id}
                onClick={() => handleStampClick(stamp.id)}
                disabled={isOnCooldown}
                className="flex-1 py-3 rounded-lg text-center transition-all"
                style={{
                  background: "var(--surface2)",
                  opacity: isOnCooldown ? 0.5 : 1,
                  cursor: isOnCooldown ? "not-allowed" : "pointer",
                }}
                title={stamp.label}
              >
                <span className="text-2xl">{stamp.emoji}</span>
                <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {stamp.label}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            ※スタンプは2秒間隔で送信可能
          </p>
          {stampError && (
            <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>
              {stampError}
            </p>
          )}

          {/* Stamp Animation Display */}
          {displayedStamps.length > 0 && (
            <div
              className="absolute -top-2 left-0 right-0 flex flex-wrap justify-center gap-1 pointer-events-none"
              style={{ transform: "translateY(-100%)" }}
            >
              {displayedStamps.map((stamp) => {
                const stampInfo = STAMPS.find((s) => s.id === stamp.stampType);
                return (
                  <div
                    key={stamp.key}
                    className="animate-bounce px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    style={{
                      background: "var(--surface2)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      animation: "stampFloat 5s ease-out forwards",
                    }}
                  >
                    <span className="text-lg">{stampInfo?.emoji}</span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--muted)" }}
                    >
                      {stamp.displayName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Complete Button */}
        <button
          onClick={handleCompleteToggle}
          className="w-full py-4 rounded-lg font-semibold text-lg transition-all"
          style={{
            background: isCompleted ? "var(--success)" : "var(--primary)",
            color: isCompleted ? "var(--primaryText)" : "var(--primaryText)",
            borderRadius: "var(--r-md)",
          }}
        >
          {isCompleted ? "✓ 完了済み" : "完了！"}
        </button>

        {/* Support Buttons */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--surface)" }}
        >
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: "var(--muted)" }}
          >
            応援する（交換性なし・演出のみ）
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[300, 500, 1000, 3000].map((amount) => (
              <button
                key={amount}
                className="py-3 px-2 rounded-lg font-semibold text-sm transition-all hover:opacity-80"
                style={{
                  background: "var(--surface2)",
                  color: "var(--text)",
                  borderRadius: "var(--r-sm)",
                }}
              >
                ¥{amount.toLocaleString()}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            ※応援は配信者への支援金です。機能解放や優先権は付与されません
          </p>
        </div>

        {/* Support History (D-010: Time-ordered only, no rankings/totals) */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--surface)" }}
        >
          <h3
            className="text-sm font-medium mb-3"
            style={{ color: "var(--muted)" }}
          >
            応援履歴（最新10件・時系列順）
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {supportHistory.length === 0 ? (
              <p
                className="text-sm text-center py-4"
                style={{ color: "var(--muted)" }}
              >
                まだ応援はありません
              </p>
            ) : (
              supportHistory.map((support) => (
                <div
                  key={support.id}
                  className="flex items-center justify-between p-2 rounded-lg text-sm"
                  style={{ background: "var(--surface2)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {support.displayName}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        ¥{support.amount.toLocaleString()}
                      </span>
                    </div>
                    {support.message && (
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--muted)" }}
                      >
                        {support.message}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs ml-2 shrink-0"
                    style={{ color: "var(--muted)" }}
                  >
                    {new Date(support.createdAt).toLocaleTimeString("ja-JP", {
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

        {/* Chat - Break time only */}
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--surface)",
            opacity: sessionData.status === "working" ? 0.6 : 1,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">
              チャット
              {sessionData.status === "break" && (
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--success)",
                    color: "var(--primaryText)",
                  }}
                >
                  利用可能
                </span>
              )}
            </h3>
            {sessionData.status === "working" && (
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ background: "var(--surface2)", color: "var(--muted)" }}
              >
                休憩中のみ
              </span>
            )}
          </div>

          {sessionData.status === "break" ? (
            <>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  休憩中はチャットが利用できます
                </p>
              </div>
              <input
                type="text"
                placeholder="メッセージを入力..."
                className="w-full p-2 rounded-lg text-sm"
                style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </>
          ) : (
            <div
              className="p-6 rounded-lg text-center"
              style={{ background: "var(--surface2)" }}
            >
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                💬 休憩時間になるとチャットが利用できます
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                作業中はスタンプで反応を送りましょう
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
