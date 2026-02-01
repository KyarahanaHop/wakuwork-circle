# WakuWork Circle

配信者が作業セッション部屋を立て、視聴者が入室して同席作業＋応援できるWebサービス。

## コンセプト

- **同席作業**: 配信者と視聴者が一緒に作業する空間
- **応援（返礼なし）**: 300/500/1000/3000円のプリセットから選択
- **交換性禁止**: 応援で機能解放・優先権は与えない（演出のみ）
- **治安UI強制**: 初見制限、通報/ブロック導線、休憩時のみチャット

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables
- **Package Manager**: pnpm（推奨）またはnpm
- **Node.js**: 20.11.0 (LTS)

## セットアップ

```bash
# 1. リポジトリクローン
git clone <repository-url>
cd wakuwork-circle

# 2. Node.jsバージョン指定（.nvmrc参照）
nvm use

# 3. 依存インストール（rootで実行）
pnpm install

# 4. 開発サーバー起動
pnpm dev
```

## 開発方法

```bash
# 開発サーバー起動（http://localhost:3000）
pnpm dev

# プロダクションビルド
pnpm build

# リントチェック
pnpm lint

# 色直書きチェック
pnpm check:colors
```

## テーマ切り替え

`data-theme`属性で切り替え：

- `simple`（デフォルト）- クリアでプロフェッショナル
- `cute`（パステル）- 背景ほぼ白＋うっすらピンク
- `cool`（ダーク）- 落ち着いた青系

テーマは自動的にlocalStorageに保存されます。

## 画面一覧

| 画面 | パス | 説明 |
|------|------|------|
| Room | `/room` | 視聴者が作業に参加・応援する画面 |
| Dashboard | `/dashboard` | 配信者がセッションを管理する画面 |
| Overlay | `/overlay` | OBS等で使用するオーバーレイ表示 |

## Git運用

### Conventional Commits

```
feat: 新機能
fix: バグ修正
docs: ドキュメントのみ
style: コードスタイル（動作変更なし）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・補助ツール
```

例: `feat: add room timer component`

### Git Hooksセットアップ

```bash
git config core.hooksPath .githooks
```

## ドキュメント

- [SSoT Index](docs/SSoT_INDEX.md) - Single Source of Truthの索引
- [Design Constitution](docs/design/design-constitution.md) - デザイン憲法
- [Component Constitution](docs/design/component-constitution.md) - コンポーネント憲法
- [Themes](docs/ui/themes.md) - テーマ変数定義（SSoT）
- [Screens](docs/ui/screens.md) - 画面仕様
- [Tech Stack ADR](docs/architecture/adr-0001-tech-stack.md) - 技術選定ADR

## リモート接続手順

GitHubリポジトリ作成後：

```bash
git remote add origin https://github.com/<user>/wakuwork-circle.git
git push -u origin main
```

## ライセンス

MIT License（仮）

## 注意事項

このプロジェクトは開発中です。決済機能等は現時点で実装されていません。
