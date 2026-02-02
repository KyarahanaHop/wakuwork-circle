'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

// SSoT準拠: 作業カテゴリ（6種）
const WORK_CATEGORIES = [
  { id: 'practice', label: '練習' },
  { id: 'study', label: '勉強' },
  { id: 'create', label: '制作' },
  { id: 'work', label: '作業' },
  { id: 'break', label: '休憩' },
  { id: 'other', label: 'その他' },
] as const;

type CategoryId = typeof WORK_CATEGORIES[number]['id'];

// SSoT準拠: スタンプ（4種固定）
const STAMPS = [
  { id: 'wave', emoji: '👋', label: '挨拶' },
  { id: 'like', emoji: '👍', label: 'いいね' },
  { id: 'alert', emoji: '❗', label: '！' },
  { id: 'sleepy', emoji: '😴', label: '眠い' },
] as const;

type StampId = typeof STAMPS[number]['id'];

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

  const sendStamp = useCallback((stampId: StampId, onSend: (id: StampId) => void) => {
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
  }, [canSendStamp, cooldownMs]);

  return { sendStamp, isOnCooldown, canSendStamp };
}

// モックデータ（Phase 2でAPI取得に変更）
const INITIAL_ROOM_DATA = {
  id: 'room-001',
  streamerName: 'サンプル配信者',
  status: 'working' as 'working' | 'break', // 'working' | 'break'
  timer: '45:23',
  declaration: 'デザインシステムの設計とドキュメント作成',
  participants: 12,
  supportOptions: [
    { amount: 300, label: '応援' },
    { amount: 500, label: '応援' },
    { amount: 1000, label: '応援' },
    { amount: 3000, label: '応援' },
  ],
  chatMessages: [
    { user: 'ユーザーA', message: '頑張ってください！', time: '14:30' },
    { user: 'ユーザーB', message: '同期して作業します', time: '14:32' },
  ],
  // 応援一覧（時系列順）- 表示時にslice(0,10)で最新10件に制限
  supportHistory: [
    { id: 's1', displayName: '参加者#3', amount: 500, time: '15:45', message: '頑張って！' },
    { id: 's2', displayName: '参加者#7', amount: 1000, time: '15:30', message: '' },
    { id: 's3', displayName: '参加者#1', amount: 300, time: '15:15', message: '応援してます' },
    { id: 's4', displayName: '参加者#5', amount: 3000, time: '15:00', message: 'ファイト！' },
    { id: 's5', displayName: '参加者#2', amount: 500, time: '14:45', message: '' },
    { id: 's6', displayName: '参加者#9', amount: 300, time: '14:30', message: '同時作業中' },
    { id: 's7', displayName: '参加者#4', amount: 1000, time: '14:15', message: '' },
    { id: 's8', displayName: '参加者#6', amount: 500, time: '14:00', message: 'いつも見てます' },
    { id: 's9', displayName: '参加者#8', amount: 300, time: '13:45', message: '' },
    { id: 's10', displayName: '参加者#10', amount: 500, time: '13:30', message: '' },
    { id: 's11', displayName: '参加者#11', amount: 1000, time: '13:15', message: '' }, // 11件目（表示されない）
  ],
};

// 初期の完了者リスト（モック）
const INITIAL_COMPLETED_MEMBERS = [
  { displayName: '参加者#1' },
  { displayName: '参加者#3' },
  { displayName: '参加者#5' },
  { displayName: '参加者#7' },
  { displayName: '参加者#8' },
  { displayName: '参加者#9' },
  { displayName: '参加者#10' },
];

// 自分の表示名（モック）
const MY_DISPLAY_NAME = 'あなた';

export default function RoomPage() {
  const params = useParams();
  const code = params.code as string;
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('practice');
  const [shortText, setShortText] = useState('');
  const { sendStamp, isOnCooldown } = useStampRateLimit(2000);
  
  // 完了者リストをstate管理（Fix 4: 完了ボタンのトグルで更新）
  const [completedMembers, setCompletedMembers] = useState(INITIAL_COMPLETED_MEMBERS);
  
  // 完了者数を計算（自分の状態も反映）
  const completedCount = completedMembers.length;
  const totalParticipants = INITIAL_ROOM_DATA.participants;

  const handleStampClick = (stampId: StampId) => {
    sendStamp(stampId, (id) => {
      console.log(`[Stamp] ${id} sent at ${new Date().toISOString()}`);
      // TODO: API呼び出しに置き換え
    });
  };

  const handleShortTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setShortText(value);
    }
  };

  // 完了ボタンのトグル処理（Fix 4）
  const handleCompleteToggle = () => {
    setIsCompleted((prev) => {
      const newValue = !prev;
      if (newValue) {
        // 完了時: 自分を完了者リストに追加
        setCompletedMembers((members) => {
          if (!members.some((m) => m.displayName === MY_DISPLAY_NAME)) {
            return [...members, { displayName: MY_DISPLAY_NAME }];
          }
          return members;
        });
      } else {
        // 取消時: 自分を完了者リストから削除
        setCompletedMembers((members) =>
          members.filter((m) => m.displayName !== MY_DISPLAY_NAME)
        );
      }
      return newValue;
    });
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="text-sm px-3 py-1 rounded-md transition-colors"
            style={{ background: 'var(--surface2)', color: 'var(--text)' }}
          >
            ← 退出
          </Link>
          <h1 className="text-lg font-semibold">{INITIAL_ROOM_DATA.streamerName}の部屋</h1>
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
            {code}
          </span>
        </div>
        <ThemeSwitcher />
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Status & Timer */}
        <div 
          className="p-4 rounded-lg flex justify-between items-center"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-3">
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                background: INITIAL_ROOM_DATA.status === 'working' ? 'var(--primary)' : 'var(--warning)',
                color: INITIAL_ROOM_DATA.status === 'working' ? 'var(--primaryText)' : 'var(--text)'
              }}
            >
              {INITIAL_ROOM_DATA.status === 'working' ? '作業中' : '休憩中'}
            </span>
            <span style={{ color: 'var(--muted)' }}>
              参加者: {totalParticipants}人
            </span>
          </div>
          <span className="text-3xl font-mono font-bold">
            {INITIAL_ROOM_DATA.timer}
          </span>
        </div>

        {/* Declaration */}
        <div 
          className="p-6 rounded-lg"
          style={{ background: 'var(--surface)' }}
        >
          <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
            今回の宣言
          </h2>
          <p className="text-lg font-medium" style={{ color: 'var(--primary)' }}>
            {INITIAL_ROOM_DATA.declaration}
          </p>
        </div>

        {/* Your Work Status - Category & Short Text */}
        <div 
          className="p-4 rounded-lg"
          style={{ background: 'var(--surface)' }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
            あなたの作業
          </h3>
          
          {/* Category Selection */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {WORK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: selectedCategory === cat.id ? 'var(--primary)' : 'var(--surface2)',
                    color: selectedCategory === cat.id ? 'var(--primaryText)' : 'var(--text)',
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
              placeholder="今やっていることを短文で..."
              className="w-full p-2 pr-12 rounded-lg text-sm"
              style={{ 
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}
            />
            <span 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: shortText.length >= 45 ? 'var(--error)' : 'var(--muted)' }}
            >
              {shortText.length}/50
            </span>
          </div>
        </div>

        {/* Stamps */}
        <div 
          className="p-4 rounded-lg"
          style={{ background: 'var(--surface)' }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
            スタンプ
            {isOnCooldown && (
              <span className="ml-2 text-xs" style={{ color: 'var(--warning)' }}>
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
                  background: 'var(--surface2)',
                  opacity: isOnCooldown ? 0.5 : 1,
                  cursor: isOnCooldown ? 'not-allowed' : 'pointer',
                }}
                title={stamp.label}
              >
                <span className="text-2xl">{stamp.emoji}</span>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {stamp.label}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            ※スタンプは2秒間隔で送信可能
          </p>
        </div>

        {/* Complete Button (Fix 4: トグルで完了者リストを更新) */}
        <button
          onClick={handleCompleteToggle}
          className="w-full py-4 rounded-lg font-semibold text-lg transition-all"
          style={{ 
            background: isCompleted ? 'var(--success)' : 'var(--primary)',
            color: isCompleted ? 'var(--primaryText)' : 'var(--primaryText)',
            borderRadius: 'var(--r-md)'
          }}
        >
          {isCompleted ? '✓ 完了済み' : '完了！'}
        </button>

        {/* Progress & Completed Members (Fix 4: stateベースで更新) */}
        <div 
          className="p-4 rounded-lg"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex justify-between text-sm mb-3">
            <span style={{ color: 'var(--muted)' }}>
              完了: {completedCount}人 / {totalParticipants}人
            </span>
            <span style={{ color: 'var(--muted)' }}>
              {Math.round((completedCount / totalParticipants) * 100)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div 
            className="h-2 rounded-full overflow-hidden mb-3"
            style={{ background: 'var(--surface2)' }}
          >
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${(completedCount / totalParticipants) * 100}%`,
                background: 'var(--success)'
              }}
            />
          </div>
          
          {/* Completed Members List */}
          {completedMembers.length > 0 && (
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                完了済み:
              </p>
              <div className="flex flex-wrap gap-1">
                {completedMembers.map((member, i) => (
                  <span 
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      background: member.displayName === MY_DISPLAY_NAME ? 'var(--primary)' : 'var(--surface2)', 
                      color: member.displayName === MY_DISPLAY_NAME ? 'var(--primaryText)' : 'var(--text)' 
                    }}
                  >
                    {member.displayName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Support Buttons */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
            応援する（交換性なし・演出のみ）
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {INITIAL_ROOM_DATA.supportOptions.map((option) => (
              <button
                key={option.amount}
                className="py-3 px-2 rounded-lg font-semibold text-sm transition-all hover:opacity-80"
                style={{ 
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  borderRadius: 'var(--r-sm)'
                }}
              >
                ¥{option.amount.toLocaleString()}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            ※応援は配信者への支援金です。機能解放や優先権は付与されません
          </p>
        </div>

        {/* Support History (Fix 5: slice(0,10)で最新10件に制限) */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
            応援履歴（最新10件・時系列順）
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {INITIAL_ROOM_DATA.supportHistory.slice(0, 10).map((support) => (
              <div 
                key={support.id}
                className="flex items-center justify-between p-2 rounded-lg text-sm"
                style={{ background: 'var(--surface2)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{support.displayName}</span>
                    <span className="font-semibold" style={{ color: 'var(--primary)' }}>
                      ¥{support.amount.toLocaleString()}
                    </span>
                  </div>
                  {support.message && (
                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                      {support.message}
                    </p>
                  )}
                </div>
                <span className="text-xs ml-2 shrink-0" style={{ color: 'var(--muted)' }}>
                  {support.time}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            ※時系列表示のみ（煽り防止のためランキング・合計表示なし）
          </p>
        </div>

        {/* Chat - Break time only (Step 5: 強化版) */}
        <div 
          className="p-4 rounded-lg"
          style={{ 
            background: 'var(--surface)',
            opacity: INITIAL_ROOM_DATA.status === 'working' ? 0.6 : 1,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">
              チャット
              {INITIAL_ROOM_DATA.status === 'break' && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--success)', color: 'var(--primaryText)' }}>
                  利用可能
                </span>
              )}
            </h3>
            {INITIAL_ROOM_DATA.status === 'working' && (
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                休憩中のみ
              </span>
            )}
          </div>
          
          {INITIAL_ROOM_DATA.status === 'break' ? (
            <>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {INITIAL_ROOM_DATA.chatMessages.map((msg, i) => (
                  <div key={i} className="text-sm">
                    <span style={{ color: 'var(--muted)' }}>{msg.user}</span>
                    <span className="mx-2" style={{ color: 'var(--muted)' }}>·</span>
                    <span>{msg.message}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>{msg.time}</span>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="メッセージを入力..."
                className="w-full p-2 rounded-lg text-sm"
                style={{ 
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)'
                }}
              />
            </>
          ) : (
            <div 
              className="p-6 rounded-lg text-center"
              style={{ background: 'var(--surface2)' }}
            >
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                💬 休憩時間になるとチャットが利用できます
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                作業中はスタンプで反応を送りましょう
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
