# ドメインモデル

> **Version**: v0.1  
> **Updated**: 2026-02-02  
> **Authority**: エンティティ定義の権威ファイル。

---

## 1. エンティティ一覧

### 1.1 User

| 属性 | 型 | 説明 |
|------|-----|------|
| `id` | UUID | 主キー |
| `discordId` | string | Discord OAuth ID |
| `discordName` | string | Discord表示名 |
| `nickname` | string? | ユーザー設定のニックネーム |
| `createdAt` | datetime | 登録日時 |

### 1.2 Room

| 属性 | 型 | 説明 |
|------|-----|------|
| `id` | UUID | 主キー |
| `ownerId` | UUID | FK → User.id（配信者） |
| `name` | string | ルーム名 |
| `displayNameMode` | enum | `number` / `nickname` / `animal` |
| `approvalRequired` | boolean | 承認必須フラグ（デフォルト: true） |
| `createdAt` | datetime | 作成日時 |

### 1.3 Session

| 属性 | 型 | 説明 |
|------|-----|------|
| `id` | UUID | 主キー |
| `roomId` | UUID | FK → Room.id |
| `code` | string | セッションコード（**自動生成**、英数字6-8桁） |
| `passphrase` | string | 合言葉（**配信者が手動設定**） |
| `state` | enum | `working` / `break` / `ended` |
| `declaration` | string? | 配信者の宣言 |
| `startedAt` | datetime | 開始日時 |
| `endedAt` | datetime? | 終了日時 |

**不変条件**:
- `code` は作成時に自動生成。配信者は変更不可。
- `passphrase` は配信者がいつでも手動更新可能。

### 1.4 JoinRequest

| 属性 | 型 | 説明 |
|------|-----|------|
| `id` | UUID | 主キー |
| `sessionId` | UUID | FK → Session.id |
| `userId` | UUID | FK → User.id |
| `status` | enum | `pending` / `approved` / `rejected` |
| `isFirstVisit` | boolean | ルーム初回参加フラグ |
| `requestedAt` | datetime | 申請日時 |
| `resolvedAt` | datetime? | 承認/拒否日時 |

### 1.5 SessionMember

| 属性 | 型 | 説明 |
|------|-----|------|
| `id` | UUID | 主キー |
| `sessionId` | UUID | FK → Session.id |
| `userId` | UUID | FK → User.id |
| `displayName` | string | 表示名（モードに応じて生成） |
| `category` | string? | 作業カテゴリ |
| `shortText` | string? | 短文（任意） |
| `isCompleted` | boolean | 完了フラグ |
| `isMuted` | boolean | ミュート状態 |
| `muteExpiresAt` | datetime? | ミュート解除日時 |
| `joinedAt` | datetime | 入室日時 |

### 1.6 ModerationAction

| 属性 | 型 | 説明 |
|------|-----|------|
| `id` | UUID | 主キー |
| `roomId` | UUID | FK → Room.id |
| `sessionId` | UUID? | FK → Session.id（セッション固有の場合） |
| `targetUserId` | UUID | FK → User.id（対象ユーザー） |
| `actorId` | UUID | FK → User.id（実行者=配信者） |
| `action` | enum | `kick` / `mute` / `ban` |
| `reason` | string? | 理由（任意） |
| `duration` | int? | 期間（分）。nullは無期限。 |
| `createdAt` | datetime | 実行日時 |

### 1.7 Report

| 属性 | 型 | 説明 |
|------|-----|------|
| `id` | UUID | 主キー |
| `roomId` | UUID | FK → Room.id |
| `sessionId` | UUID? | FK → Session.id |
| `reporterId` | UUID | FK → User.id（通報者=配信者） |
| `targetUserId` | UUID | FK → User.id（対象ユーザー） |
| `category` | enum | `spam` / `harassment` / `inappropriate` / `other` |
| `description` | string? | 詳細説明 |
| `status` | enum | `pending` / `reviewed` / `resolved` |
| `createdAt` | datetime | 通報日時 |

### 1.8 PinnedMessage

| 属性 | 型 | 説明 |
|------|-----|------|
| `id` | UUID | 主キー |
| `sessionId` | UUID | FK → Session.id |
| `userId` | UUID | FK → User.id（発言者） |
| `content` | string | メッセージ内容 |
| `pinnedBy` | UUID | FK → User.id（配信者） |
| `pinnedAt` | datetime | ピン日時 |

---

## 2. 関係図

```
User 1 ──── N Room (owner)
Room 1 ──── N Session
Session 1 ──── N JoinRequest
Session 1 ──── N SessionMember
Room 1 ──── N ModerationAction
Room 1 ──── N Report
Session 1 ──── N PinnedMessage
```

---

## 3. インデックス候補

| テーブル | カラム | 理由 |
|----------|--------|------|
| Session | `code` | コード検索 |
| Session | `roomId, state` | アクティブセッション検索 |
| JoinRequest | `sessionId, status` | 承認待ちリスト |
| SessionMember | `sessionId` | 参加者リスト |
| ModerationAction | `roomId, targetUserId` | BAN確認 |
