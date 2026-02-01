---
description: Interactive plan creation with review loop (Web版)
---

# /plan - Interactive Plan Creation (WakuWork Circle)

You are facilitating an **interactive plan creation session** for WakuWork Circle.

## PURPOSE

Create a reviewed plan through dialogue:
1. User provides task description
2. You create a plan (following Prometheus format for Web projects)
3. You review the plan (following Momus criteria + WakuWork Circle constraints)
4. You present the reviewed plan to the user
5. User provides feedback → repeat until satisfied
6. Save final plan to `.sisyphus/drafts/plan.md` with `reviewed: true` flag

## WakuWork Circle 固有制約（必須）

計画作成時、以下の制約を必ず考慮すること：

**交換性禁止**: 応援で機能解放・優先権・通話権を与えない（演出のみ）
**治安UI強制**: 初見制限、通報/ブロック導線、チャットは休憩時のみデフォルト
**チャット制限**: 作業中はチャット不可、休憩時のみチャット可能

## WORKFLOW

```
User: /plan "タスク説明"
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  LOOP until user approves:                                  │
│                                                             │
│  1. Create plan (Prometheus format for Web) → Save          │
│  2. Self-review (Momus + WakuWork constraints)              │
│  3. Present to user:                                        │
│     - Plan summary                                          │
│     - Review feedback                                       │
│     - Ask: "修正点があれば指示してください。                │
│            OKなら「承認」と言ってください。"                │
│  4. If user approves → Save and exit                        │
│     If user has feedback → Back to step 1 with feedback     │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Save to .sisyphus/drafts/plan.md (with reviewed: true)
```

## WHAT TO DO

### Step 1: Get Task Description

If `$ARGUMENTS` is empty, ask the user:
```
計画を立てたいタスクを教えてください。
```

### Step 2: Create Plan (Prometheus Format for Web)

Create a plan following this format and save to `.sisyphus/drafts/plan.md`:

```markdown
# 計画書: [タスク名]

## 1. 目的
[このタスクが何を達成するか]

## 2. 完了条件 (Definition of Done)
- [ ] [条件1]
- [ ] [条件2]

## 3. 実行ステップ

### Step 1: [ステップ名]
- **対象**: [ファイルパス / 関数名 / 画面名など具体的な対象]
- **アクション**: [何をどう変えるか - 具体的なコマンド、コード変更等]
- **成果物**: [このステップで生成・変更されるもの]
- **検証**: [どこで] [何を見て] [どうなってたら成功] （Yes/No判定可能な形式）
- **失敗時**: [詰んだ場合の戻し方・次の手]

(必要に応じて Step 2, 3, ... を追加)

## 4. リスクと対策
| リスク | 影響 | 対策 |
|--------|------|------|

## 5. 制約
- **交換性禁止**: 応援で機能解放・優先権・通話権を与えない（演出のみ）
- **治安UI強制**: 初見制限、通報/ブロック導線をUIで強制
- **チャット制限**: 作業中はチャット不可、休憩時のみチャット可能
- [その他の制約]
```

**技術スタック（WakuWork Circle）**:
- Framework: Next.js 14 (App Router)
- Language: TypeScript (.tsx, .ts)
- Styling: CSS Variables + Tailwind CSS
- Package Manager: pnpm
- Node Version: 20.11.0

**計画作成時の必須ルール**:
- 各Stepに具体的な「対象」（ファイルパス/関数名/画面名）を記載
- 「〜を検討」「〜を考慮」等の曖昧語を使わない
- 検証は「どこで・何を見て・どうなってたら成功」の形式で記載
- 各Stepを読んだ人が追加質問なしで実行できるレベルの具体性
- **SSoT準拠**: docs/ のドキュメントを参照
- **Themeシステム**: CSS Variablesベース、data-theme="simple|cute|cool"

### Step 3: Self-Review (Momus + WakuWork Constraints)

計画書を作成後、以下の観点で自己レビューを行う:

**レビュー観点**:
1. **明確性**: 各ステップが具体的で実行可能か
2. **検証可能性**: 完了条件が明確で測定可能か（Yes/Noで言えるか）
3. **完全性**: 必要なステップが漏れていないか
4. **リスク**: 潜在的な問題点が考慮されているか
5. **WakuWork制約**: 交換性禁止、治安UI強制、チャット制限、ルーム/セッション分離が遵守されているか（参照: `docs/ssot/core.md`）

**レビュー結果フォーマット**:

```
## 判定: OKAY

（または REJECT - どちらか一方のみ）

## Blocker（REJECT時のみ、最大3件）
これを直せばOKAYになる必須修正項目：
1. [Blocker 1]
2. [Blocker 2]

## 任意提案（承認可否に影響しない）
- [提案1]

## 良い点
- [良い点1]
```

**収束ルール**:
- Blockerは最大3件
- REJECT時は「これを直せばOKAY」を承認条件として明示
- 2回目以降は差分レビュー（前回Blockerが解消されたかのみ確認）

### Step 4: Present to User

計画書とレビュー結果をユーザーに提示:

```markdown
## 計画書

{content from .sisyphus/drafts/plan.md}

---

## レビュー結果

**判定**: {OKAY or REJECT}

**Blocker**: {REJECT時のみ}
{blocker list}

**任意提案**: {optional suggestions}

**良い点**: {good points}

---

**REJECTの場合**: Blockerを修正してください。
**OKAYの場合 or 問題なければ「承認」と言ってください。**
```

### Step 5: Handle User Response

- If user says "承認", "OK", "LGTM", "問題なし" → Go to Step 6
- If user provides feedback → Include feedback in Step 2 and repeat

### Step 6: Add Reviewed Flag (REQUIRED)

計画が承認されたら、**必ず** YAML frontmatter を追加してください:

**必須フィールド（3つ全て必須）**:
- `reviewed: true` — レビュー済みフラグ
- `reviewed_at: {ISO timestamp}` — レビュー完了日時
- `task: {task_description}` — タスク説明

**手順**:
1. Read `.sisyphus/drafts/plan.md`
2. Add frontmatter at the beginning:
   ```markdown
   ---
   reviewed: true
   reviewed_at: 2026-02-01T13:30:00+09:00
   task: "Room画面のテーマ切り替え機能実装"
   ---
   
   {existing plan content}
   ```

**重要**: 
- `reviewed: true` がないと `/start-work` は警告を出す
- `task:` がないと後で混乱する
- `reviewed_at` は ISO 8601 形式

After saving, report:

```
計画書を保存しました: .sisyphus/drafts/plan.md

この計画で作業を開始するには:
  /start-work

または直接編集:
  /start-work-atlas
```

## IMPORTANT RULES

1. **Always perform self-review** - Never skip the review step
2. **Keep user in the loop** - Always present plan and ask for approval
3. **Save with reviewed flag** - The `reviewed: true` flag is critical
4. **Use concrete language** - Avoid vague terms like "検討する", "考慮する"
5. **WakuWork constraints** - Always check 交換性禁止/治安UI強制/チャット制限/ルーム・セッション分離（参照: docs/ssot/core.md）
6. **SSoT compliance** - Reference docs/ for design decisions

## NOTE

This command creates plans for WakuWork Circle Web project.

Technical stack:
- Next.js 14 + TypeScript
- CSS Variables + Tailwind CSS
- pnpm package manager
- Theme system: data-theme attribute
