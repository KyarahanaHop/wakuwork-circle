"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

// API response type
interface OverlayData {
  code: string;
  state: "working" | "break" | "ended";
  startedAt: string;
  elapsedSec: number;
  participantsCount: number;
  completedCount: number;
  pendingCount: number;
  stamps: Array<{
    type: string;
    count: number;
    lastAt: string | null;
  }>;
  latestSupport: {
    amount: number;
    message: string | null;
    createdAt: string;
  } | null;
}

// Stamp emoji mapping
const STAMP_EMOJI: Record<string, string> = {
  wave: "👋",
  like: "👍",
  alert: "❗",
  sleepy: "😪",
};

export default function OverlayPage() {
  const params = useParams();
  const code = params.code as string;

  const searchParams = useSearchParams();
  const isDebug = searchParams.get("debug") === "1";

  const [data, setData] = useState<OverlayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch overlay data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/overlay?code=${code}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "データ取得に失敗しました");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [code]);

  // Initial fetch + polling (every 2 seconds)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Format elapsed time as HH:MM:SS
  const formatElapsed = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen p-4">
        <div
          className="p-3"
          style={{
            background: "var(--overlay-surface)",
            color: "var(--overlay-text)",
            borderRadius: "var(--r-md)",
          }}
        >
          読み込み中...
        </div>
      </main>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <main className="min-h-screen p-4">
        <div
          className="p-3"
          style={{
            background: "var(--overlay-surface)",
            color: "var(--danger)",
            borderRadius: "var(--r-md)",
          }}
        >
          {error || "データがありません"}
        </div>
      </main>
    );
  }

  // Calculate completion percentage
  const completionPercent =
    data.participantsCount > 0
      ? Math.round((data.completedCount / data.participantsCount) * 100)
      : 0;

  return (
    <main className="min-h-screen p-4">
      {/* Debug Mode: Back link - only shown when ?debug=1 */}
      {isDebug && (
        <div className="mb-4">
          <Link
            href="/"
            className="text-sm px-3 py-1 rounded-md transition-colors inline-block"
            style={{
              background: "var(--overlay-surface)",
              color: "var(--overlay-text)",
              borderRadius: "var(--r-md)",
            }}
          >
            ← 戻る
          </Link>
        </div>
      )}

      {/* OBS Overlay Content - Transparent background */}
      <div className="space-y-3">
        {/* Session State Badge */}
        <div
          className="inline-block px-3 py-1 text-sm font-medium"
          style={{
            background:
              data.state === "working"
                ? "var(--success)"
                : data.state === "break"
                  ? "var(--warning)"
                  : "var(--muted)",
            color: "white",
            borderRadius: "var(--r-sm)",
          }}
        >
          {data.state === "working"
            ? "作業中"
            : data.state === "break"
              ? "休憩中"
              : "終了"}
          {data.state !== "ended" && ` ${formatElapsed(data.elapsedSec)}`}
        </div>

        {/* Stats Bar */}
        <div
          className="flex items-center gap-4 p-3"
          style={{
            background: "var(--overlay-surface)",
            color: "var(--overlay-text)",
            borderRadius: "var(--r-md)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--overlay-muted)" }}>
              参加者
            </span>
            <span className="text-xl font-bold">{data.participantsCount}</span>
          </div>
          <div
            className="w-px h-6"
            style={{ background: "var(--overlay-muted)" }}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--overlay-muted)" }}>
              完了
            </span>
            <span className="text-xl font-bold">{completionPercent}%</span>
          </div>
          {data.pendingCount > 0 && (
            <>
              <div
                className="w-px h-6"
                style={{ background: "var(--overlay-muted)" }}
              />
              <div className="flex items-center gap-2">
                <span
                  className="text-sm"
                  style={{ color: "var(--overlay-muted)" }}
                >
                  待機
                </span>
                <span className="text-xl font-bold">{data.pendingCount}</span>
              </div>
            </>
          )}
        </div>

        {/* Recent Stamps */}
        {data.stamps.length > 0 && (
          <div
            className="flex items-center gap-3 p-2"
            style={{
              background: "var(--overlay-surface)",
              borderRadius: "var(--r-md)",
              backdropFilter: "blur(4px)",
            }}
          >
            {data.stamps.map((stamp) => (
              <div key={stamp.type} className="flex items-center gap-1">
                <span className="text-lg">
                  {STAMP_EMOJI[stamp.type] || "❓"}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--overlay-text)" }}
                >
                  ×{stamp.count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Latest Support */}
        {data.latestSupport && (
          <div
            className="p-3"
            style={{
              background: "var(--overlay-surface)",
              color: "var(--overlay-text)",
              borderRadius: "var(--r-md)",
              border: "2px solid var(--primary)",
              backdropFilter: "blur(4px)",
            }}
          >
            <p
              className="text-xs mb-1"
              style={{ color: "var(--overlay-muted)" }}
            >
              最新の応援
            </p>
            <p className="font-semibold">
              ¥{data.latestSupport.amount.toLocaleString()}
              {data.latestSupport.message && (
                <span className="ml-2 text-sm font-normal">
                  「{data.latestSupport.message}」
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Debug Mode: Usage Note - only shown when ?debug=1 */}
      {isDebug && (
        <div
          className="mt-8 p-4"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--r-md)",
          }}
        >
          <h2 className="font-semibold mb-2">OBSでの使用方法</h2>
          <ol
            className="list-decimal list-inside space-y-1 text-sm"
            style={{ color: "var(--muted)" }}
          >
            <li>OBSで「ブラウザ」ソースを追加</li>
            <li>URLに「{`http://localhost:3000/overlay/${code}`}」を入力</li>
            <li>幅: 400px、高さ: 200px程度を推奨</li>
            <li>背景透過を有効にする</li>
          </ol>
          <div
            className="mt-4 p-2 rounded text-xs"
            style={{ background: "var(--surface-alt)" }}
          >
            <p>
              <strong>API:</strong> GET /api/overlay?code={code}
            </p>
            <p>
              <strong>State:</strong> {data.state}
            </p>
            <p>
              <strong>Polling:</strong> 2秒間隔
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
