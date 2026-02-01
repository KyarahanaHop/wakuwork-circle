# Git Hooks

このディレクトリには、ローカル開発用のGit hooksが含まれています。

## セットアップ

以下のコマンドでhooksを有効化してください：

```bash
git config core.hooksPath .githooks
```

## 含まれるHooks

### pre-commit

コミット前に以下のチェックを実行します：
- ステージングされたファイルのリントチェック
- TypeScriptの型チェック（apps/web）

## CI連携

この検証は `.github/workflows/ci.yml` でも実行されます。
PRがマージされる前に必ず検証が通ることが保証されます。
