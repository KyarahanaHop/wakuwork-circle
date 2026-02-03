# SSoT (Single Source of Truth) Index

> **Version**: v0.1  
> **Updated**: 2026-02-02

## WakuWork Circle ドキュメント体系

このディレクトリは WakuWork Circle の Single Source of Truth（SSoT）です。

---

## ドキュメント権限マトリックス

### 仕様コア（最優先）

| ドメイン         | 権威ファイル                       | 説明                                   |
| ---------------- | ---------------------------------- | -------------------------------------- |
| **仕様全体**     | `docs/ssot/core.md`                | **最優先**。仕様衝突時はこれを正とする |
| **意思決定ログ** | `docs/ssot/decisions.md`           | **確定した意思決定（D-xxx, A-xxx）**   |
| ドメインモデル   | `docs/ssot/domain-model.md`        | エンティティ定義、関係                 |
| フロー           | `docs/ssot/flows.md`               | 参加フロー、状態遷移                   |
| 可視性           | `docs/ssot/identity-visibility.md` | 誰が誰を見れるか                       |
| モデレーション   | `docs/ssot/moderation.md`          | Kick/Mute/Ban/Report定義               |
| Pro/保持         | `docs/ssot/pro-retention.md`       | Pro機能、データ保持ポリシー            |
| 未決事項         | `docs/ssot/open-questions.md`      | 技術選定等の未決事項一覧               |

### デザイン・UI

| ドメイン           | 権威ファイル                            | 説明                                            |
| ------------------ | --------------------------------------- | ----------------------------------------------- |
| デザイン原則       | `docs/design/design-constitution.md`    | UX方針。交換性禁止・治安UI強制を定義            |
| コンポーネント規約 | `docs/design/component-constitution.md` | 実装規約。Semantic Tokenの使用方法              |
| 画面仕様           | `docs/ui/screens.md`                    | 画面要件。Room/Dashboard/Overlay等              |
| テーマ/トークン    | `docs/ui/themes.md`                     | 全テーマ変数の定義源。globals.cssはこれから生成 |

### アーキテクチャ・ビジネス

| ドメイン     | 権威ファイル                               | 説明                             |
| ------------ | ------------------------------------------ | -------------------------------- |
| 技術選定     | `docs/architecture/adr-0001-tech-stack.md` | 技術決定の記録。選定理由と代替案 |
| ビジネス制約 | `docs/business/stripe-connect-memo.md`     | 決済システムの罠と対策           |

---

## 衝突解決ルール

### 優先順位

```
1. docs/ssot/core.md          ← 仕様の最終権威
2. docs/ssot/decisions.md     ← 確定した意思決定
3. docs/ssot/*.md             ← ドメイン別詳細（上記2つ以外）
4. docs/design/*.md           ← デザイン・UX方針
5. docs/ui/*.md               ← 画面・テーマ仕様
6. docs/architecture/*.md     ← 技術選定
7. 実装コード                  ← 最下位
```

### 衝突時の対応

1. **仕様衝突は `docs/ssot/core.md` を最優先**
   - core.md と他ファイルが矛盾 → core.md が正
   - core.md を更新する場合は、関連ファイルも同期

2. **同じ内容が複数ファイルに存在する場合**:
   - 上記マトリックスの「権威ファイル」を正とする
3. **コードとドキュメントが矛盾する場合**:
   - ドキュメントを正としてコードを修正する
   - ただし、ドキュメントが古い場合は先にドキュメントを更新
4. **例外が必要な場合**:
   - まずドキュメントを更新し、レビューを経てからコードを変更する

---

## 更新ガイドライン

### SSoT更新時

| 更新対象                 | 同期が必要なファイル                           |
| ------------------------ | ---------------------------------------------- |
| `core.md`                | 関連する全SSoTファイル、design-constitution.md |
| `domain-model.md`        | 型定義（将来）、API仕様（将来）                |
| `flows.md`               | screens.md の該当セクション                    |
| `themes.md`              | `apps/web/src/app/globals.css`                 |
| `design-constitution.md` | 影響を受ける画面実装                           |
| `screens.md`             | 対応する `page.tsx`                            |

### コミットルール

- SSoT更新は単独コミット推奨
- コミットメッセージ例:
  - `docs: update core.md with new chat restrictions`
  - `docs: sync screens.md with flows.md`

---

## 関連ファイル

### 実装

- テーマ実装: `apps/web/src/app/globals.css`
- コンポーネント: `apps/web/src/components/`
- 画面実装: `apps/web/src/app/*/page.tsx`

### AI設定

- エージェント設定: `.opencode/agents/*.md`
- コマンド設定: `.opencode/commands/*.md`

---

## クイックリファレンス

**「この仕様どこに書いてある？」**

| 知りたいこと         | 参照先                             |
| -------------------- | ---------------------------------- |
| 全体像を1枚で        | `docs/ssot/core.md`                |
| 確定した意思決定     | `docs/ssot/decisions.md`           |
| エンティティ定義     | `docs/ssot/domain-model.md`        |
| 参加の流れ           | `docs/ssot/flows.md`               |
| 匿名性ルール         | `docs/ssot/identity-visibility.md` |
| Kick/Mute/Banの定義  | `docs/ssot/moderation.md`          |
| Proで何ができる？    | `docs/ssot/pro-retention.md`       |
| まだ決まってないこと | `docs/ssot/open-questions.md`      |
| 画面レイアウト       | `docs/ui/screens.md`               |
| 色・テーマ           | `docs/ui/themes.md`                |
