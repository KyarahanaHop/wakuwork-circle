# Vercel デプロイ手順

> **Version**: v1.0  
> **Updated**: 2026-02-03  
> **対象**: TASK-001 (Discord OAuth + Supabase/Prisma)

---

## 1. 前提条件

### 1.1 必要なアカウント

- [Vercel](https://vercel.com) アカウント
- [Supabase](https://supabase.com) アカウント
- [Discord Developer Portal](https://discord.com/developers/applications) アクセス権

### 1.2 ローカル環境

- Node.js 20.11.0+
- pnpm 8.15.0+

---

## 2. Supabase セットアップ

### 2.1 プロジェクト作成

1. Supabase ダッシュボードで新規プロジェクト作成
2. リージョン選択（日本ユーザー向けなら `ap-northeast-1` 推奨）
3. データベースパスワードを安全に保存

### 2.2 接続文字列の取得

**Project Settings > Database** から取得:

```
# Transaction Pooler (ランタイム用)
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Session Pooler / Direct (CLI用)
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### 2.3 Prismaマイグレーション

ローカルで実行:

```bash
cd apps/web

# .env.local を作成
cp .env.example .env.local

# DATABASE_URL と DIRECT_URL を設定後:
npx prisma migrate dev --name init
```

---

## 3. Discord OAuth セットアップ

### 3.1 アプリケーション作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. "New Application" をクリック
3. アプリ名を入力（例: `WakuWork Circle`）

### 3.2 OAuth2 設定

**OAuth2 > General**:

- Client ID をコピー → `AUTH_DISCORD_ID`
- Client Secret を生成 → `AUTH_DISCORD_SECRET`

**OAuth2 > Redirects**:

以下のリダイレクトURLを追加:

```
# ローカル開発
http://localhost:3000/api/auth/callback/discord

# Vercel本番
https://your-app.vercel.app/api/auth/callback/discord
```

---

## 4. Vercel セットアップ

### 4.1 プロジェクトのインポート

1. Vercel ダッシュボードで "Add New Project"
2. GitHub リポジトリを選択
3. Framework Preset: `Next.js`
4. Root Directory: `apps/web`

### 4.2 環境変数の設定

**Project Settings > Environment Variables** で以下を設定:

| 変数名                 | 説明                        | 例                                                 |
| ---------------------- | --------------------------- | -------------------------------------------------- |
| `DATABASE_URL`         | Supabase Transaction Pooler | `postgres://...?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL`           | Supabase Direct Connection  | `postgres://...:5432/postgres`                     |
| `AUTH_SECRET`          | NextAuth署名キー            | `npx auth secret` で生成                           |
| `AUTH_DISCORD_ID`      | Discord Client ID           | `123456789012345678`                               |
| `AUTH_DISCORD_SECRET`  | Discord Client Secret       | `abcdef...`                                        |
| `NEXTAUTH_URL`         | アプリURL                   | `https://your-app.vercel.app`                      |
| `ALLOWED_STREAMER_IDS` | 配信者Discord ID            | `123...,234...`                                    |

### 4.3 ビルド設定

**Project Settings > General**:

- Build Command: `pnpm build`
- Output Directory: (自動検出)
- Install Command: `pnpm install`

---

## 5. デプロイ後の確認

### 5.1 動作確認チェックリスト

- [ ] `/login` でDiscordログイン画面が表示される
- [ ] ログイン後、ホームページにリダイレクトされる
- [ ] 配信者（allowlist）はダッシュボードにアクセスできる
- [ ] 非配信者はダッシュボードにアクセスできない
- [ ] `/join/[code]` で合言葉入力画面が表示される

### 5.2 ログ確認

Vercel ダッシュボード > Deployments > Functions で:

- API呼び出しのログを確認
- エラーがないかチェック

---

## 6. 配信者の招待

### 6.1 Discord User ID の取得方法

1. Discord で「開発者モード」を有効化（設定 > 詳細設定）
2. ユーザーを右クリック → 「IDをコピー」
3. 18桁の数字がUser ID

### 6.2 allowlist への追加

Vercel 環境変数 `ALLOWED_STREAMER_IDS` にカンマ区切りで追加:

```
ALLOWED_STREAMER_IDS=123456789012345678,234567890123456789
```

**変更後は再デプロイが必要**

---

## 7. トラブルシューティング

### 7.1 "Invalid redirect_uri" エラー

Discord Developer Portal で Redirect URL が正しく設定されているか確認。

### 7.2 データベース接続エラー

- `DATABASE_URL` に `?pgbouncer=true&connection_limit=1` が含まれているか確認
- Supabase プロジェクトがアクティブか確認

### 7.3 セッションが保持されない

- `AUTH_SECRET` が設定されているか確認
- `NEXTAUTH_URL` がデプロイURLと一致しているか確認

---

## 8. 参照

- [NextAuth.js Docs](https://authjs.dev)
- [Prisma + Supabase](https://www.prisma.io/docs/orm/overview/databases/supabase)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
