---
description: Start Sisyphus work session (Web版 - orchestrator不要)
agent: atlas
---

# /start-work - Work Session Entry Point (WakuWork Circle)

WakuWork Circle向けの作業開始コマンド。

## IMPORTANT: Web版ではorchestratorを使用しない

WakuWork CircleはWebプロジェクトのため、シンプルな構成とする：
- Planは`.sisyphus/drafts/plan.md`から読み込み
- Atlasが直接実行
- 必要に応じてMomus/Oracleレビューは手動で実行

## WHAT TO DO

1. **Extract task description**:
   - If `$ARGUMENTS` has content: use it as task description
   - If `$ARGUMENTS` is empty: read from `.sisyphus/drafts/plan.md`

2. **Determine the plan file**:

   a. If `$ARGUMENTS` contains `--plan-file <path>`:
      - Use that file as the plan
   
   b. If `.sisyphus/drafts/plan.md` exists:
      - Read and check for `reviewed: true` in YAML frontmatter
      - If `reviewed: true`: Use it as the plan
      - If NOT `reviewed: true`: Report warning but still use it
   
   c. Otherwise:
      - Report error: "No plan found. Create a plan with /plan first."

3. **Execute work**:
   - Atlas (you) executes the plan steps directly
   - Follow Prometheus plan format
   - Each step should have: 対象, アクション, 検証, 失敗時

4. **Report progress**:
   - Report each step completion
   - Save evidence to `.sisyphus/evidence/{timestamp}/`

## WakuWork Circle 固有制約

実行時、以下の制約を常に確認すること：

**交換性禁止**: 応援で機能解放・優先権・通話権を与えない（演出のみ）
**治安UI強制**: 初見制限、通報/ブロック導線を適切に実装
**チャット制限**: 作業中はチャット不可、休憩時のみチャット可能

## OUTPUT FORMAT

Before execution, report:
```
Starting Work Session (WakuWork Circle)

Plan Source: .sisyphus/drafts/plan.md
Task: {task description}
Constraints: 交換性禁止 / 治安UI強制 / チャット制限 / ルーム・セッション分離（参照: docs/ssot/core.md）

Executing plan...
```

## CRITICAL

- **SSoT準拠**: docs/ のドキュメントを常に参照
- **Themeシステム**: CSS Variablesベース、data-theme属性使用
- **Component規約**: docs/design/component-constitution.md 準拠
- **Evidence保存**: 実行結果は `.sisyphus/evidence/` に保存

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>
