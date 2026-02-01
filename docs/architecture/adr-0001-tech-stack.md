# ADR-0001: 技術スタック選定

## ステータス

- **決定**: 承認済み
- **日付**: 2026-02-01
- **決定者**: 開発チーム

## 文脈

WakuWork CircleのWebサービス実装にあたり、技術スタックを選定する必要がある。

## 選定した技術スタック

| カテゴリ | 技術 | バージョン |
|----------|------|------------|
| Framework | Next.js | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Package Manager | pnpm | 8.x |
| Node.js | LTS | 20.11.0 |

## 選定理由

### Next.js 14

**選定理由**:
- App RouterによるServer Componentsの活用
- ファイルベースのルーティングで開発効率が高い
- Vercelへのデプロイが容易
- Reactエコシステムの最新機能に対応

**代替案**:
- Remix: 良い選択肢だが、Next.jsの方がエコシステムが大きい
- SvelteKit: 学習コストが発生

### TypeScript

**選定理由**:
- 型安全性によるバグの早期発見
- IDEサポートによる開発体験の向上
- チーム開発でのコード品質維持

**代替案**:
- JavaScript: 型安全性がないため不採用

### Tailwind CSS

**選定理由**:
- ユーティリティファーストで開発速度が速い
- CSS Variablesとの親和性が高い
- ビルド時に未使用スタイルを除去し軽量

**代替案**:
- CSS Modules: Tailwindと併用可能
- styled-components: ランタイムオーバーヘッドがあるため不採用

### pnpm

**選定理由**:
- ディスク容量の節約（ハードリンク使用）
- 厳格な依存関係管理
- npmより高速

**代替案**:
- npm: 問題なく動作するが、pnpmの方が優位
- yarn: pnpmと同等の機能だが、pnpmが軽量

## テーマシステム

### CSS Variablesベース

**選定理由**:
- ランタイムオーバーヘッドなし
- Tailwind CSSとの統合が容易
- data-theme属性による簡単な切り替え

### テーマ切り替え方式

```tsx
// ThemeProvider経由でhtml要素にdata-themeを設定
document.documentElement.setAttribute('data-theme', 'cute');
```

**選定理由**:
- React Contextとの親和性
- localStorageへの永続化が容易
- SSR時のハイドレーション問題を回避

## 制約

- **不交換性**: styled-components等のCSS-in-JSは使用しない
- **SSoT準拠**: テーマ変数はdocs/ui/themes.mdを正とする
- **モノレポ**: pnpm workspaceを使用（将来の拡張に備える）

## 影響

- 開発者はTypeScriptとTailwind CSSの知識が必要
- デザインシステムはCSS Variablesベースで構築
- ビルド時に最適化され、ランタイムコストが最小

## 参考

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [pnpm Documentation](https://pnpm.io/installation)
