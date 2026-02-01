# SSoT (Single Source of Truth) Index

## WakuWork Circle ドキュメント体系

このディレクトリは WakuWork Circle の Single Source of Truth（SSoT）です。

## ドキュメント権限マトリックス

| ドメイン | 権威ファイル | 説明 |
|----------|--------------|------|
| テーマ/トークン | `docs/ui/themes.md` | 全テーマ変数の定義源。globals.cssはこれから生成される |
| デザイン原則 | `docs/design/design-constitution.md` | UX方針の最終決定権。交換性禁止・治安UI強制を定義 |
| コンポーネント規約 | `docs/design/component-constitution.md` | 実装規約の最終決定権。Semantic Tokenの使用方法 |
| 画面仕様 | `docs/ui/screens.md` | 画面要件の定義源。Room/Dashboard/Overlayの仕様 |
| 技術選定 | `docs/architecture/adr-0001-tech-stack.md` | 技術決定の記録。選定理由と代替案 |
| ビジネス制約 | `docs/business/stripe-connect-memo.md` | 決済システムの罠と対策 |

## 衝突解決ルール

1. **同じ内容が複数ファイルに存在する場合**:
   - 上記マトリックスの「権威ファイル」を正とする
   
2. **コードとドキュメントが矛盾する場合**:
   - ドキュメントを正としてコードを修正する
   - ただし、ドキュメントが古い場合は先にドキュメントを更新
   
3. **例外が必要な場合**:
   - まずドキュメントを更新し、レビューを経てからコードを変更する

## 優先順位

```
docs/ui/themes.md > 実装コード
docs/design/design-constitution.md > UI実装
docs/design/component-constitution.md > コンポーネント実装
```

## 更新ガイドライン

- **themes.md更新時**: `apps/web/src/app/globals.css` も同期すること
- **design-constitution.md更新時**: 影響を受ける画面を特定し、必要に応じて修正
- **screens.md更新時**: 対応するpage.tsxを更新

## 関連ファイル

- テーマ実装: `apps/web/src/app/globals.css`
- コンポーネント: `apps/web/src/components/`
- 画面実装: `apps/web/src/app/*/page.tsx`
