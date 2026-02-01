# コンポーネント憲法

> **Version**: v0.1  
> **Updated**: 2026-02-02  
> **Authority**: コンポーネント実装規約の権威ファイル。

## 1. 命名規則

### 1.1 ファイル名

- コンポーネント: PascalCase（例: `ThemeProvider.tsx`）
- ユーティリティ: camelCase（例: `useTheme.ts`）
- スタイル: コンポーネントと同名（例: `Button.module.css`）

### 1.2 コンポーネント名

- 意味のある名前（例: `PrimaryButton` より `SubmitButton`）
- 略語を避ける（例: `Btn` ❌ `Button` ✅）

## 2. スタイル規約

### 2.1 CSS変数必須

```tsx
// Good
<button 
  style={{ background: 'var(--primary)', color: 'var(--primaryText)' }}
>

// Bad
<button 
  style={{ background: '#2563eb', color: '#fff' }}
>
```

### 2.2 Tailwind CSS併用

TailwindのユーティリティクラスとCSS変数を組み合わせる:

```tsx
// Good
<div className="p-4 rounded-lg" style={{ background: 'var(--surface)' }}>

// Bad（CSS変数を使わない）
<div className="p-4 rounded-lg bg-gray-100">
```

### 2.3 角丸・影・アニメーション

CSS変数で統一:

```css
border-radius: var(--r-sm);  /* 6px */
border-radius: var(--r-md);  /* 10px */
border-radius: var(--r-lg);  /* 16px */

box-shadow: var(--shadow-1); /* 0 2px 4px rgba(0,0,0,0.05) */
box-shadow: var(--shadow-2); /* 0 4px 12px rgba(0,0,0,0.08) */

transition-duration: var(--dur-1); /* 150ms */
transition-duration: var(--dur-2); /* 200ms */
transition-duration: var(--dur-3); /* 300ms */
```

## 3. コンポーネント構造

### 3.1 基本テンプレート

```tsx
// components/Button.tsx
'use client'; // 必要な場合のみ

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ 
  variant = 'primary', 
  children, 
  ...props 
}: ButtonProps) {
  return (
    <button
      style={{
        background: variant === 'primary' ? 'var(--primary)' : 'var(--surface)',
        color: variant === 'primary' ? 'var(--primaryText)' : 'var(--text)',
        borderRadius: 'var(--r-md)',
        padding: '0.5rem 1rem',
      }}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 3.2 クライアントコンポーネント

`'use client'` は以下の場合のみ使用:
- useState/useEffect等のReact hooksを使用
- ブラウザAPIにアクセス
- イベントハンドラを持つ

それ以外はServer Componentとして実装。

## 4. ファイル配置

```
src/
├── components/          # 再利用可能なコンポーネント
│   ├── ThemeProvider.tsx
│   ├── ThemeSwitcher.tsx
│   └── ui/             # 汎用UIコンポーネント（将来的）
│       ├── Button.tsx
│       └── Card.tsx
├── app/                # ページコンポーネント
│   ├── page.tsx
│   ├── layout.tsx
│   ├── room/
│   ├── dashboard/
│   └── overlay/
└── lib/                # ユーティリティ
    └── utils.ts
```

## 5. Props規約

### 5.1 命名

- boolean: `is~`, `has~`, `should~`（例: `isLoading`, `hasError`）
- callback: `on~`（例: `onClick`, `onSubmit`）
- オプショナル: 末尾に`?`（TypeScript）

### 5.2 デフォルト値

意味のあるデフォルトを設定:

```tsx
interface Props {
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

// デフォルト値
const { size = 'md', disabled = false } = props;
```

## 6. 禁止事項

- CSS-in-JS（styled-components等）は使用しない
- CSS Modulesは局所スタイルのみに使用
- インラインスタイルの過度な使用（CSS変数以外）
- テーマ固有の条件分岐（if theme === 'cute'）

## 7. アクセシビリティ

- すべての画像にalt属性
- フォーム要素にlabel
- キーボード操作可能
- コントラスト比4.5:1以上
