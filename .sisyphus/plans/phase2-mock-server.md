---
reviewed: true
reviewed_at: 2026-02-02T16:00:00+09:00
task: "Phase 2: 擬似サーバ（mockState + API Routes）"
momus_verdict: OKAY
---

# 計画書: Phase 2 - 擬似サーバ（mockState + API Routes）

## 1. 目的
Phase 1で作成した画面導線に「本物っぽい」状態管理を追加する。
DBを導入せずにMVPの価値検証を行うため、擬似サーバ（メモリストア + API Routes）を実装する。

## 2. 完了条件 (Definition of Done)
- [ ] apps/web/src/lib/mockState.ts が作成されグローバルなセッション状態を管理する
- [ ] POST /api/join がセッションコード検証と参加リクエスト処理を行う
- [ ] GET /api/session/[code] が現在のセッション状態を返す
- [ ] POST /api/approve が配信者による承認処理を行う
- [ ] 視聴者がJoin→Lobby→Roomの流れをたどれる（モックデータで動作確認）
- [ ] 配信者Dashboardで承認待ち一覧が見え、Approveで視聴者がRoomに進める

## 3. 実行ステップ

### Step 1: lib/mockState.ts を作成
- **対象**: apps/web/src/lib/mockState.ts（新規作成）
- **アクション**:
  - Session型を定義（code, passphrase, passphraseRequired, status, participants, pendingApprovals）
  - globalThisを使ってHMRでも状態を維持
  - mockStateオブジェクトをエクスポート（getSession, createSession, addPending, approveUser, rejectUser）
- **成果物**: lib/mockState.ts
- **検証**: pnpm dev 実行中にファイルを保存し、ページリロードしてもデータが保持されれば成功（HMR耐性）
- **失敗時**: ファイルを削除して再作成

### Step 2: 初期モックセッションを設定
- **対象**: apps/web/src/lib/mockState.ts（既存）
- **アクション**:
  - 開発用の初期セッションを2つ作成:
    - ABC123: passphraseRequired=true, passphrase=waku
    - XYZ789: passphraseRequired=false
  - モジュール読み込み時に自動作成（開発環境のみ）
- **成果物**: 初期化ロジック追加
- **検証**: ブラウザコンソールで mockState.getSession(ABC123) が値を返せば成功
- **失敗時**: 初期化コードをコメントアウト

### Step 3: POST /api/join Route Handler を作成
- **対象**: apps/web/src/app/api/join/route.ts（新規作成）
- **アクション**:
  - POSTリクエストを受け付ける
  - リクエストボディからcodeとpassphraseを取得
  - mockState.getSessionでセッションを検索
  - 存在しなければ404エラー
  - passphraseRequired=trueかつ不一致なら403エラー
  - 成功時はpendingに追加し、userIdとrequiresApprovalを返す
- **成果物**: app/api/join/route.ts
- **検証**: curlコマンドでテストし、成功レスポンスが返ればOK
- **失敗時**: Route Handlerの型定義を確認（Next.js 14 App Router規約）

### Step 4: GET /api/session/[code] Route Handler を作成
- **対象**: apps/web/src/app/api/session/[code]/route.ts（新規作成）
- **アクション**:
  - 動的ルートでcodeを受け取る
  - mockState.getSessionでセッションを取得
  - 存在しなければ404
  - passphraseなど機密情報を除外して返す
- **成果物**: app/api/session/[code]/route.ts
- **検証**: curl http://localhost:3000/api/session/ABC123 → セッション情報が返れば成功
- **失敗時**: 動的ルートのparams型を確認

### Step 5: POST /api/approve Route Handler を作成
- **対象**: apps/web/src/app/api/approve/route.ts（新規作成）
- **アクション**:
  - code, userId, action（approve/reject）を受け取る
  - actionに応じてapproveUserまたはrejectUserを呼び出す
  - 成功レスポンスを返す
- **成果物**: app/api/approve/route.ts
- **検証**: Dashboardから承認リクエストを送信し、200 OKが返れば成功
- **失敗時**: mockStateのメソッド実装を確認

### Step 6: Join画面をAPI連携
- **対象**: apps/web/src/app/page.tsx（Phase 1で変更済み）
- **アクション**:
  - セッションコード入力フォームに onSubmit ハンドラーを追加
  - fetch(/api/join, { method: POST, ... }) を呼び出し
  - 成功時: /{code} へ遷移
  - 失敗時: エラーメッセージ表示
- **成果物**: API連携済みのJoin画面
- **検証**: http://localhost:3000 で有効なコード（ABC123）を入力し、合言葉入力画面またはLobbyへ遷移すれば成功
- **失敗時**: DevTools NetworkタブでAPIレスポンスを確認

### Step 7: /[code]（合言葉画面）をAPI連携
- **対象**: apps/web/src/app/[code]/page.tsx（Phase 1で作成済み）
- **アクション**:
  - ページ読み込み時に fetch(/api/session/{code}) を実行
  - passphraseRequired に応じてUI分岐
  - 次へボタンで POST /api/join を実行し成功時に /lobby/{code} へ
- **成果物**: API連携済みの合言葉画面
- **検証**:
  - http://localhost:3000/ABC123 → 合言葉入力が必要
  - http://localhost:3000/XYZ789 → 自動でlobbyへリダイレクト
- **失敗時**: useEffectの依存配列を確認

### Step 8: Lobby画面をAPI連携
- **対象**: apps/web/src/app/lobby/[code]/page.tsx（Phase 1で作成済み）
- **アクション**:
  - 定期的（5秒間隔）に fetch(/api/session/{code}) をポーリング
  - レスポンスの status が approved になったら /room/{code} へ遷移
  - 承認されたら進むボタン（手動遷移用）を維持（フォールバック）
- **成果物**: API連携済みのLobby画面
- **検証**: Dashboardで承認後、Lobbyが自動的にRoomへ遷移すれば成功
- **失敗時**: ポーリング間隔を調整、クリーンアップ関数を確認

### Step 9: DashboardをAPI連携（承認機能）
- **対象**: apps/web/src/app/dashboard/[code]/page.tsx（Phase 1で作成済み）
- **アクション**:
  - 定期的（3秒間隔）に fetch(/api/session/{code}) をポーリング
  - pendingApprovals を表示（承認待ちリスト）
  - 承認・拒否ボタンで POST /api/approve を実行
- **成果物**: API連携済みのDashboard
- **検証**: 
  1. Joinから参加リクエストを送信
  2. Dashboardに承認待ちが表示される
  3. 承認ボタンをクリックで承認完了
- **失敗時**: APIレスポンスの型を確認

### Step 10: ビルド検証
- **対象**: 全API Routes
- **アクション**:
  - pnpm build を実行
  - Route Handlerの型エラーがあれば修正
- **成果物**: ビルド可能なAPI Routes
- **検証**: pnpm build が exit code 0 で完了すれば成功
- **失敗時**: Next.jsのRoute Handler構文を確認

## 4. リスクと対策
| リスク | 影響 | 対策 |
|--------|------|------|
| globalThisの型エラー | コンパイルエラー | TypeScriptの型アサーションで対応 |
| HMRで状態がリセット | 開発体験低下 | globalThis使用でHMR耐性を確保 |
| API Routeの型不整合 | ビルドエラー | Next.js 14のRequest/Response型を厳守 |
| ポーリングの無限実行 | メモリリーク | useEffectのクリーンアップ必須 |
| 複数ユーザーでの競合 | 状態の不整合 | MVPでは許容（本実装でDBトランザクション） |

## 5. 制約
- DB不使用: MVPではメモリストアのみ、本実装は後日
- リアルタイム通信なし: HTTPポーリング方式（MVP許容）
- セキュリティ: passphraseは平文、本実装ではハッシュ化
- 参照SSoT: docs/ssot/core.md Section 3.1（OAuth）、Section 3.2（アクセス）
- 参照SSoT: docs/ssot/flows.md Section 1（参加フロー）

## 6. レビュー結果

### 判定: OKAY

### Blocker
なし

### 任意提案
1. ポーリング間隔: 5秒は開発用の暫定。本実装ではWebSocketまたはSSEに移行
2. エラーハンドリング: APIエラー時のUIフィードバック（トースト等）を追加するとUX向上

### 良い点
- globalThisを使ったHMR耐性の考慮がされている
- Route Handlerの型定義が具体的
- 検証がcurlコマンドまで含めて具体的
- 各APIエンドポイントの責務が明確

---

推定工数: 2-3時間
依存: Phase 1完了後に実行（画面導線が必要）
