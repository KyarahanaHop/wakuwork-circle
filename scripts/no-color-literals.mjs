#!/usr/bin/env node
/**
 * Color Literal Checker
 * 
 * apps/web/src 内でhex/rgba/hslの直書きを検出します。
 * 例外: globals.css（テーマ定義のみ許可）
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TARGET_DIR = join(__dirname, '..', 'apps', 'web', 'src');
const EXCLUDED_FILES = [
  'globals.css', // テーマ定義ファイルは許可
];

// 検出パターン
const COLOR_PATTERNS = [
  { regex: /#[0-9a-fA-F]{3,8}\b/g, name: 'hex color' },
  { regex: /rgba?\s*\(/g, name: 'rgb/rgba' },
  { regex: /hsla?\s*\(/g, name: 'hsl/hsla' },
];

// 許可されるケース（CSS変数定義内やコメント内など）
const ALLOWED_CONTEXTS = [
  /\/\*[\s\S]*?\*\//, // ブロックコメント
  /\/\/.*$/, // 行コメント
];

function findFiles(dir, files = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      findFiles(fullPath, files);
    } else if (stat.isFile()) {
      const ext = extname(item);
      // 対象ファイル: .tsx, .ts, .css（globals.css除く）
      if ((ext === '.tsx' || ext === '.ts' || ext === '.css') && 
          !EXCLUDED_FILES.includes(item)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    for (const pattern of COLOR_PATTERNS) {
      const matches = line.match(pattern.regex);
      if (matches) {
        // コメント内かチェック
        const isInComment = ALLOWED_CONTEXTS.some(ctx => ctx.test(line));
        if (!isInComment) {
          violations.push({
            line: lineNum,
            content: line.trim(),
            pattern: pattern.name,
          });
        }
      }
    }
  }
  
  return violations;
}

function main() {
  console.log('🔍 Checking for color literals in source files...\n');
  
  const files = findFiles(TARGET_DIR);
  let totalViolations = 0;
  let filesWithViolations = 0;
  
  for (const file of files) {
    const violations = checkFile(file);
    
    if (violations.length > 0) {
      filesWithViolations++;
      totalViolations += violations.length;
      
      console.log(`❌ ${file}`);
      for (const v of violations) {
        console.log(`   Line ${v.line}: ${v.pattern}`);
        console.log(`   ${v.content.substring(0, 80)}${v.content.length > 80 ? '...' : ''}`);
      }
      console.log();
    }
  }
  
  if (totalViolations === 0) {
    console.log('✅ No color literals found! All colors use CSS variables.\n');
    process.exit(0);
  } else {
    console.log(`❌ Found ${totalViolations} color literal(s) in ${filesWithViolations} file(s).\n`);
    console.log('Please use CSS variables instead:');
    console.log('  - var(--bg), var(--surface), var(--primary)');
    console.log('  - var(--text), var(--muted)');
    console.log('  - var(--overlay-surface), var(--overlay-text) for overlays\n');
    process.exit(1);
  }
}

main();
