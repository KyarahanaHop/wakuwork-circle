# UIテーマ定義

> **Version**: v0.1  
> **Updated**: 2026-02-02  
> **Authority**: このファイルが全テーマ変数の権威。globals.cssはここから生成。

**生成先**: `apps/web/src/app/globals.css`

## 基本トークン（Simple Theme - デフォルト）

Cute/Coolテーマは半径・影・アニメーションを上書きします。

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

## オーバーレイトークン

`/overlay` ページ用のトークン。data-mode="overlay" と共に使用。

| テーマ | `--overlay-surface` | `--overlay-text` | `--overlay-muted` |
|--------|---------------------|------------------|-------------------|
| Simple | rgba(0,0,0,0.7) | #ffffff | rgba(255,255,255,0.7) |
| Cute | rgba(255,182,193,0.85) | #4a4a4a | rgba(74,74,74,0.7) |
| Cool | rgba(15,23,42,0.85) | #f8fafc | rgba(148,163,184,0.8) |

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

**カラートークン:**

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

**形状・影・アニメーション:**

| トークン | 値 | 特徴 |
|----------|-----|------|
| `--r-sm` | 10px | 丸みを強調（+4px） |
| `--r-md` | 16px | 丸みを強調（+6px） |
| `--r-lg` | 24px | 丸みを強調（+8px） |
| `--shadow-1` | 0 2px 8px rgba(255,105,180,0.1) | ピンクティント |
| `--shadow-2` | 0 4px 16px rgba(255,105,180,0.15) | ピンクティント |
| `--dur-1` | 120ms | やや遅く（-30ms） |
| `--dur-2` | 180ms | やや遅く（-20ms） |
| `--dur-3` | 240ms | やや遅く（-60ms） |

### Cool Theme（ダーク寄り）

落ち着いた青系のダークテーマ。

**カラートークン:**

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

**形状・影・アニメーション:**

| トークン | 値 | 特徴 |
|----------|-----|------|
| `--r-sm` | 4px | シャープ（-2px） |
| `--r-md` | 6px | シャープ（-4px） |
| `--r-lg` | 10px | シャープ（-6px） |
| `--shadow-1` | 0 2px 8px rgba(6,182,212,0.15) | シアンティント |
| `--shadow-2` | 0 4px 20px rgba(6,182,212,0.25) | シアンティント |
| `--dur-1` | 100ms | 素早く（-50ms） |
| `--dur-2` | 150ms | 素早く（-50ms） |
| `--dur-3` | 200ms | 素早く（-100ms） |

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
<div className="bg-surface text-theme rounded-md shadow-1">
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

## オーバーレイモード

OBS等で背景透過が必要な場合、ページルートで `data-mode="overlay"` を設定:

```tsx
// ThemeProviderで自動設定（/overlay パス時）
html[data-mode="overlay"] body {
  background: transparent !important;
}
```

オーバーレイページではトークン経由で色を指定:

```css
.overlay-panel {
  background: var(--overlay-surface);
  color: var(--overlay-text);
}
```

## 同期手順

`themes.md` を更新したら:

1. `apps/web/src/app/globals.css` を更新
2. アプリケーションで変更を確認
3. コミットメッセージに「Sync with themes.md」を含める
