# SSoT Changelog

> **MVP Lock Version**: v0.1-lock  
> **Date**: 2026-02-02  
> **Correlation ID**: WAKUWORK_SSoT_MVP_LOCK_v1

---

## Summary

本CHANGELOGは、SSoT MVP Lockレビュー（MINA_REVIEW_v1）に基づくP0変更の概要を記録する。

### P0-1: 応援者一覧の金額表示ポリシー変更

**変更前**: 視聴者には金額を非表示（配信者のみ表示）  
**変更後**: 全閲覧者に金額を表示（時系列固定、ランキング・合計・上位絞込禁止）

**理由**: 透明性確保のため。ただし煽り防止のため、時系列表示のみとし、ランキング・合計・上位絞込は禁止。

**更新ファイル**:
- `docs/ssot/core.md` (Section 7.4)
- `docs/ui/screens.md` (Section 4.1, 4.2)

---

### P0-2: 合言葉（Passphrase）ON/OFF切り替え機能追加

**追加**: `passphraseRequired: boolean`（デフォルト: true）

**挙動**:
- `true`: 参加時に合言葉入力が必須（従来通り）
- `false`: セッションコードのみで参加可能（合言葉入力スキップ）

**理由**: 配信者が「知り合い限定」の厳密さを調整できるようにする。

**更新ファイル**:
- `docs/ssot/core.md` (Section 2: Passphrase定義)
- `docs/ssot/domain-model.md` (Session entity)
- `docs/ssot/flows.md` (Section 1: 参加フロー)
- `docs/ui/screens.md` (Section 1: Join画面)

---

### P0-3: 検索機能の表現を明確化

**変更前**: 「検索機能なし」  
**変更後**: 「キーワード検索なし」+「参加はセッションコード入力（=ID入力）のみ」

**理由**: 「検索」が「セッションコード入力」を含む曖昧さを排除。

**更新ファイル**:
- `docs/ssot/core.md` (Section 3.2)

---

## Files Modified

| File | Changes |
|------|---------|
| `docs/ssot/core.md` | 用語定義（Passphrase ON/OFF）、応援者一覧表示ポリシー、ルーム公開範囲の表現 |
| `docs/ssot/domain-model.md` | Session entityに`passphraseRequired: boolean`追加 |
| `docs/ssot/flows.md` | 参加フローに条件分岐（passphraseRequired判定）追加 |
| `docs/ui/screens.md` | Join画面の合言葉入力を条件付き表示に変更、応援者一覧表示を更新 |

---

## Verification

- [x] `pnpm check:colors` - Pass
- [x] `pnpm lint` - Pass  
- [x] `pnpm build` - Pass

---

## Reviewer

**MINA_REVIEW_v1** - SSoT MVP Lock Review

