---
reviewed: true
reviewed_at: 2026-02-02T16:10:00+09:00
task: "Phase 1: ルーティングをSSoTへ寄せる（画面の骨）"
momus_verdict: OKAY (v2)
---

## 0. 変更点（v2）
前回Momusレビューからの修正:
- **Blocker 1対応**: `/[code]` → `/join/[code]` に変更（catch-all競合回避）
- **Blocker 2対応**: Step 4-6を詳細化（git mv、params取得、import修正の具体手順）
- **Blocker 3対応**: passphraseRequiredのデータソースを明記（Phase 1: モック固定、Phase 2: API取得）

# 計画書: Phase 1 - ルーティングをSSoTへ寄せる（画面の骨）

## 1. 目的
SSoT（Single Source of Truth）で定義された「参加導線」を実装する。
現在の静的ルーティング `/` → `/room` を、SSoT準拠の `/` (Join) → 合言葉 → `/lobby/[code]` → `/room/[code]` に変更する。

## 2. 完了条件 (Definition of Done)
- [ ] `/` が Join画面（セッションコード入力）として機能する
- [ ] `/join/[code]` が合言葉入力画面（passphraseRequired=true時）または即座にlobbyへ遷移（false時）
- [ ] `/lobby/[code]` が承認待ち画面として存在する
- [ ] `/room/[code]` が動的ルーティングで視聴者画面として機能する
- [ ] `/dashboard/[code]` が配信者管理画面として機能する
- [ ] `/overlay/[code]` がOBS用透過表示として機能する
- [ ] 全画面でSSoTの用語（セッションコード、合言葉、ロビー、承認）が使用されている

## 3. 実行ステップ

### Step 1: `/` をJoin画面に変更
- **対象**: `apps/web/src/app/page.tsx`
- **アクション**: 既存のナビゲーションハブを削除し、SSoT準拠のJoin画面を実装
  - セッションコード入力フィールド（英数字6-8桁）
  - 「参加する」ボタン
  - 入力値を検証（空・無効な文字チェック: `/^[A-Za-z0-9]{6,8}$/`）
  - 有効なコード入力時に `/join/{code}` へ遷移（`router.push`）
- **成果物**: Join画面となるpage.tsx
- **検証**: `pnpm dev` で http://localhost:3000 を開き、セッションコード入力欄と参加ボタンが表示されれば成功
- **失敗時**: 元のpage.tsxをgit checkoutで復元

### Step 2: `/join/[code]`（合言葉入力画面）を作成
- **対象**: `apps/web/src/app/join/[code]/page.tsx`（新規作成）
- **アクション**: 
  - ディレクトリ作成: `mkdir -p apps/web/src/app/join/[code]`
  - 動的ルート `join/[code]` を作成（**注意**: `/[code]`は使用禁止、catch-allと競合するため）
  - セッションコードを表示（`params.code`から取得）
  - **passphraseRequiredの判定**:
    - Phase 1: モック値を使用（`const passphraseRequired = true;`）
    - Phase 2: `fetch(/api/session/${code})`から取得に変更
  - true時: 合言葉入力フィールドを表示
  - false時: 自動的に `/lobby/{code}` へリダイレクト（`useEffect` + `router.replace`）
  - 「次へ」ボタンで `/lobby/{code}` へ遷移
- **成果物**: `join/[code]/page.tsx`
- **検証**: http://localhost:3000/join/ABC123 にアクセスし、合言葉入力画面が表示されれば成功
- **失敗時**: `rm -rf apps/web/src/app/join` でディレクトリごと削除

### Step 3: `/lobby/[code]` を作成
- **対象**: `apps/web/src/app/lobby/[code]/page.tsx`（新規作成）
- **アクション**:
  - 動的ルート `lobby/[code]` を作成
  - SSoT準拠のロビー画面UI:
    - 配信者アイコン・名前
    - 「承認を待っています...」メッセージ
    - スピナー表示
    - キャンセルボタン（`/` へ戻る）
  - 現時点ではモック: 「承認されたらRoomへ」ボタンを配置（後で自動化）
- **成果物**: `lobby/[code]/page.tsx`
- **検証**: http://localhost:3000/lobby/ABC123 にアクセスし、承認待ちUIが表示されれば成功
- **失敗時**: ディレクトリごと削除

### Step 4: `/room` を `/room/[code]` に移設
- **対象**: `apps/web/src/app/room/page.tsx` → `apps/web/src/app/room/[code]/page.tsx`
- **アクション**:
  1. ディレクトリ作成: `mkdir -p apps/web/src/app/room/[code]`
  2. ファイル移動: `git mv apps/web/src/app/room/page.tsx apps/web/src/app/room/[code]/page.tsx`
  3. コード修正:
     - コンポーネント引数に `{ params }: { params: { code: string } }` を追加
     - `params.code` でセッションコードを取得（Phase 2でAPI連携時に使用）
     - 現在のモックデータはそのまま維持
  4. ヘッダーの「戻る」リンクを `href="/"` に変更
  5. 旧ディレクトリが空なら削除: `rmdir apps/web/src/app/room` (page.tsx移動後)
- **成果物**: `room/[code]/page.tsx`（動的パラメータ対応済み）
- **検証**: http://localhost:3000/room/ABC123 にアクセスし、既存のRoom UIが表示されれば成功
- **失敗時**: `git checkout apps/web/src/app/room` で元に戻す

### Step 5: `/dashboard` を `/dashboard/[code]` に移設
- **対象**: `apps/web/src/app/dashboard/page.tsx` → `apps/web/src/app/dashboard/[code]/page.tsx`
- **アクション**:
  1. ディレクトリ作成: `mkdir -p apps/web/src/app/dashboard/[code]`
  2. ファイル移動: `git mv apps/web/src/app/dashboard/page.tsx apps/web/src/app/dashboard/[code]/page.tsx`
  3. コード修正:
     - コンポーネント引数に `{ params }: { params: { code: string } }` を追加
     - `params.code` でセッションコードを取得
  4. ロビー管理セクションを追加（承認待ちリストUIの枠）:
     ```tsx
     {/* 承認ロビー */}
     <div>
       <h2>承認ロビー (0人待ち)</h2>
       <p>現在承認待ちのユーザーはいません</p>
       {/* Phase 2でAPI連携 */}
     </div>
     ```
  5. 旧ディレクトリが空なら削除
- **成果物**: `dashboard/[code]/page.tsx`（承認ロビーUI枠追加済み）
- **検証**: http://localhost:3000/dashboard/ABC123 にアクセスし、Dashboard UIと「承認ロビー」セクションが表示されれば成功
- **失敗時**: `git checkout apps/web/src/app/dashboard` で元に戻す

### Step 6: `/overlay` を `/overlay/[code]` に移設
- **対象**: `apps/web/src/app/overlay/page.tsx` → `apps/web/src/app/overlay/[code]/page.tsx`
- **アクション**:
  1. ディレクトリ作成: `mkdir -p apps/web/src/app/overlay/[code]`
  2. ファイル移動: `git mv apps/web/src/app/overlay/page.tsx apps/web/src/app/overlay/[code]/page.tsx`
  3. コード修正:
     - コンポーネント引数に `{ params }: { params: { code: string } }` を追加
     - `params.code` でセッションコードを取得
     - デバッグモード（`?debug=1`）のuseSearchParamsロジックはそのまま維持
  4. ThemeProviderの `data-mode="overlay"` が `/overlay` で発火することを確認（pathが `/overlay/[code]` に変わるため、ThemeProvider.tsxのパス判定を `/overlay` starts withに更新が必要か確認）
  5. 旧ディレクトリが空なら削除
- **成果物**: `overlay/[code]/page.tsx`
- **検証**: 
  - http://localhost:3000/overlay/ABC123 で透過背景のOverlayが表示される
  - http://localhost:3000/overlay/ABC123?debug=1 で戻るリンクが表示される
- **失敗時**: `git checkout apps/web/src/app/overlay` で元に戻す

### Step 7: 旧ファイルの削除とビルド検証
- **対象**: 移設後の旧ディレクトリ（page.tsxが[code]配下に移動済みなら空のはず）
- **アクション**:
  1. 旧ファイル/ディレクトリの確認と削除:
     - `apps/web/src/app/room/page.tsx` が残っていれば削除（git mvで移動済みなら不要）
     - `apps/web/src/app/dashboard/page.tsx` が残っていれば削除
     - `apps/web/src/app/overlay/page.tsx` が残っていれば削除
  2. 空ディレクトリの削除（親ディレクトリにpage.tsxがない状態を確認）
  3. `pnpm build` を実行
  4. エラーがあれば修正（よくあるエラー: import path不一致、params型未定義）
- **成果物**: クリーンなApp Router構造
- **検証**: `pnpm build` が exit code 0 で完了すれば成功
- **失敗時**: エラーメッセージを確認し、動的ルートの設定を見直す。型エラーの場合は `{ params }: { params: { code: string } }` を確認

## 4. リスクと対策
| リスク | 影響 | 対策 |
|--------|------|------|
| ルートレベル`/[code]`がcatch-allと競合 | 他ルート（/lobby等）が吸い込まれる | **`/join/[code]`に変更済み**（Blocker 1対応） |
| Next.js動的ルートの設定ミス | 404エラー | `[param]` の命名規則を厳守、page.tsx必須確認 |
| 旧ファイル残存による競合 | ビルドエラー | `git mv`で移動、Step 7で残存確認・削除 |
| useSearchParams関連エラー（overlay） | SSRエラー | `?debug=1` の取得ロジックを維持、Suspense境界は後で対応 |
| ルーティング整合性の欠如 | 画面遷移不良 | 各画面の戻る/次へリンクを正しく設定 |
| ThemeProviderのパス判定ミス | overlayの透過が効かない | `/overlay`で始まるパスを判定するロジックを確認 |

## 5. 制約
- **参照SSoT**: `docs/ssot/core.md` Section 3.2（参加導線）
- **参照SSoT**: `docs/ui/screens.md` Section 1（Join画面）
- **技術制約**: Next.js 14 App Routerの動的ルート規約に従う
- **互換性**: 既存のThemeProvider、スタイルシステムを維持
- **MVPスコープ**: 現時点ではモックデータで機能を確認、本実装はPhase 2以降

## 6. レビュー結果

### 初回レビュー（v1）: REJECT
**Blocker 3件** → v2で修正済み

### v2レビュー: OKAY ✅
- Blocker 1 解決: `/[code]` → `/join/[code]` への変更でcatch-all競合を回避
- Blocker 2 解決: Step 4-6に `mkdir -p`、`git mv`、params型定義の具体的手順追加
- Blocker 3 解決: passphraseRequiredのデータソースが Phase 1（モック固定）→ Phase 2（API取得）と段階的に明記

---

**推定工数**: 2-3時間  
**依存**: Phase 2（擬似サーバ）に依存なし（独立して実行可）
