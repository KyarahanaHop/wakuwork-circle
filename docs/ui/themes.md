# UIテーマ定義

**SSoT**: このファイルが全てのテーマ変数の定義源です。  
**生成先**: `apps/web/src/app/globals.css`

## 基本トークン（テーマ共通）

| トークン | 値 | 用途 |
|----------|-----|------|
| `--r-sm` | 6px | 小さな角丸（ボタン等） |
| `--r-md` | 10px | 中くらいの角丸（カード等） |
| `--r-lg` | 16px | 大きな角丸（モーダル等） |
| `--shadow-1` | 0 2px 4px rgba(0,0,0,0.05) | 小さな影 |
| `--shadow-2` | 0 4px 12px rgba(0,0,0,0.08) | 大きな影 |
| `--dur-1` | 150ms | 短いアニメーション |
| `--dur-2` | 200ms | 標準アニメーション |
| `--dur-3` | 300ms | 長めアニメーション |

## カラートークン（テーマ別）

### Simple Theme（デフォルト）

クリアでプロフェッショナルな印象。

| トークン | 値 | 用途 |
|----------|-----|------|
| `--bg` | #ffffff | 背景 |
| `--surface` | #f8f9fa | カード背景 |
| `--surface2` | #e9ecef | 二次的表面 |
| `--text` | #212529 | 主要テキスト |
| `--muted` | #6c757d | 副次的テキスト |
| `--primary` | #2563eb | アクセント |
| `--primaryText` | #ffffff | アクセント上のテキスト |
| `--success` | #22c55e | 成功状態 |
| `--warning` | #f59e0b | 警告状態 |
| `--danger` | #ef4444 | 危険/エラー |
| `--border` | #dee2e6 | 境界線 |
| `--ring` | #3b82f6 | フォーカスリング |

### Cute Theme（パステル寄り）

背景はほぼ白＋うっすらピンク。surface2はベタピンクにしない。

| トークン | 値 | 用途 |
|----------|-----|------|
| `--bg` | #fff8fb | 背景（ほぼ白＋うっすらピンク） |
| `--surface` | #fff0f5 | カード背景 |
| `--surface2` | #ffe4f0 | 二次的表面（薄ピンク） |
| `--text` | #4a4a4a | 主要テキスト |
| `--muted` | #9a9a9a | 副次的テキスト |
| `--primary` | #ff69b4 | アクセント（ホットピンク） |
| `--primaryText` | #ffffff | アクセント上のテキスト |
| `--success` | #90ee90 | 成功状態（ライトグリーン） |
| `--warning` | #ffd700 | 警告状態（ゴールド） |
| `--danger` | #ff6b6b | 危険/エラー（ライトレッド） |
| `--border` | #ffcce0 | 境界線（ピンク系） |
| `--ring` | #ff69b4 | フォーカスリング |

### Cool Theme（ダーク寄り）

落ち着いた青系のダークテーマ。

| トークン | 値 | 用途 |
|----------|-----|------|
| `--bg` | #0f172a | 背景（濃い青黒） |
| `--surface` | #1e293b | カード背景 |
| `--surface2` | #334155 | 二次的表面 |
| `--text` | #f8fafc | 主要テキスト |
| `--muted` | #94a3b8 | 副次的テキスト |
| `--primary` | #06b6d4 | アクセント（シアン） |
| `--primaryText` | #0f172a | アクセント上のテキスト |
| `--success` | #10b981 | 成功状態 |
| `--warning` | #f59e0b | 警告状態 |
| `--danger` | #f43f5e | 危険/エラー |
| `--border` | #475569 | 境界線 |
| `--ring` | #06b6d4 | フォーカスリング |

## 使用方法

### CSS

```css
.my-component {
  background: var(--surface);
  color: var(--text);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-1);
}
```

### Tailwind CSS

```tsx
<div className="bg-surface text-text rounded-md shadow-1">
```

### JavaScript/TypeScript

```tsx
<div style={{ background: 'var(--surface)', color: 'var(--text)' }}>
```

## テーマ切り替え

```tsx
// ThemeProvider経由
document.documentElement.setAttribute('data-theme', 'cute');
```

## 同期手順

`themes.md` を更新したら:

1. `apps/web/src/app/globals.css` を更新
2. アプリケーションで変更を確認
3. コミットメッセージに「Sync with themes.md」を含める
